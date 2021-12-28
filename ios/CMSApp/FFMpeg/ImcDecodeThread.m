//
//  ImcDecodeThread.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 10/23/12.
//
//

#import "ImcDecodeThread.h"
#import "codecf/CodecWrapper.h"
#import "MobileBase.h"

#define  MAX_ENCODED_FRAME 100
#define  NOT_DROP_DECODED_FRAME   0  //by default, use 0 for struct member, means not to drop decoded frame
#define  DROP_DECODED_FRAME    1

@implementation ImcDecodeThread

@synthesize delegate, needToResetDecoderForChannelIndex;

-(id)init
{
    self = [super init];
    if( self )
    {
        isRunning = false;
        waitThread = [[NSCondition alloc] init];
        encodedFrames = [[ImcQueue alloc] init:MAX_ENCODED_FRAME];
        for( int index = 0; index < IMC_MAX_CHANNEL; index++ )
            decoders[index] = nil;
        newResolution = [NSMutableArray array];
        needIFrame = NO;
        newestTime = -1;
        currentTime = -1;
        
        //For CPU analyzer
        int mib[2U] = { CTL_HW, HW_NCPU };
        size_t sizeOfNumCPUs = sizeof(numCPUs);
        int status = sysctl(mib, 2U, &numCPUs, &sizeOfNumCPUs, NULL, 0U);
        if(status)
        numCPUs = 1;
        
        CPUUsageLock = [[NSLock alloc] init];
        updateTimer = [NSTimer scheduledTimerWithTimeInterval:10
                                                        target:self
                                                      selector:@selector(frameControl)
                                                      userInfo:nil
                                                      repeats:YES];
        decoderMappings = [NSMutableArray array];
        videoMode = NO_VIDEO;
        needToResetDecoderForChannelIndex = -1;
        
    }
    return self;
}

- (void)addCommand:(ImcCommand *)command
{
    [encodedFrames enqueue:command];
    [waitThread lock];
    [waitThread signal];
    [waitThread unlock];
}

-(void)setVideoMode:(IMC_VIDEO_MODE)mode
{
    videoMode = mode;
}

- (BOOL)addEncodedFrame:(EncodedFrame *)frame
{
    if(!isSuspendedThread)
    {
   
        NSData* encodedFrame = frame.frameData;
        if (encodedFrame != nil) {
            VideoEncodeDataHeader* vedHeader = (VideoEncodeDataHeader*)encodedFrame.bytes;
            if (vedHeader->time > 0) {
                newestTime = vedHeader->time;
            }
            //encodedFrame = nil;
        }
        [encodedFrames enqueue:frame];
		// dongpt: add nil
        encodedFrame = nil;
    }
    else
    {
        isSuspendedThread = NO;
        return FALSE;
    }
    
    [waitThread lock];
    [waitThread signal];
    [waitThread unlock];
    
    return TRUE;
}

//lvxt begin
- (void)clearEncodedFrameQueue:(BOOL)clear
{
    isSuspendedThread = clear;
    [encodedFrames clearQueue];
}
//lvxt end

-(void)startThread
{
    self->isRunning = TRUE;
    [CodecfDecoder initFFmpeg];
    [NSThread detachNewThreadSelector:@selector(mainThreadProc:) toTarget:self withObject:nil];
    [self setStackSize:1024*1024];
    [self start];
}

-(void)stopThread
{
    [encodedFrames clearQueue];
    self->isRunning = FALSE;
    [waitThread lock];
    [waitThread signal];
    [waitThread unlock];
    [decoderMappings removeAllObjects];
}

- (void)mainThreadProc:(id)object
{
    //@autoreleasepool
    {
        while (isRunning)
        {
            [waitThread lock];
            [waitThread wait];
            [waitThread unlock];
            while ( ![encodedFrames empty] )
            {
                @autoreleasepool
                {
                    if(indicesOfDecoders!=nil && decoderMappings.count > 0)
                    {
                        [decoderMappings removeObjectsAtIndexes:indicesOfDecoders];
                        indicesOfDecoders = nil;
                    }
                    EncodedFrame* encodingFrame = (EncodedFrame*)[encodedFrames dequeue];
                    NSData* frameData = encodingFrame.frameData;
                    if (frameData != nil)
                    {
                        NSInteger frameChannelIndex = encodingFrame.videoFrameInfo.channelIndex;
                        VideoEncodeDataHeader* vedHeader = (VideoEncodeDataHeader*)frameData.bytes;
                        
                        if (vedHeader->array_item[0].size > [frameData length]) {
                            NSLog(@"Invalid Size");
                            continue;
                        }
                        
                        if (newestTime != -1 && newestTime - vedHeader->time >= 3 && videoMode == LIVE_VIDEO) {
                            
                            //NSLog(@"Drop Delay Frame");
                            //continue;
                        }

                        if(videoMode == LIVE_VIDEO && encodingFrame.videoFrameInfo.frameMode == SEARCH_VIEW)
                        {
                            NSLog(@"Drop wrong mode Frame");
                            continue;
                        }
                        
                        if( frameChannelIndex < 0 || frameChannelIndex > IMC_MAX_CHANNEL )
                        {
                            NSLog(@"Invalid Channel ID");
                            continue;
                        }
                        
                        if(encodingFrame.videoFrameInfo.frameMode == SNAPSHOT)
                        {
                            NSLog(@"Snap shot");
                        }
                        switch (vedHeader->ve_format.codec_id)
                        {
                            case H264_CODEC:
                            case MPEG4_CODEC:
                            case MPEG4_CODEC_2:
                            case MPEG4_CODEC_3:
                            {
                                BOOL existedMap = NO;
                                decoderMapping* channelMap = nil;
                                long channelIndex = (encodingFrame.videoFrameInfo.frameMode==SEARCH_VIEW)? (IMC_MAX_CHANNEL-1) : encodingFrame.videoFrameInfo.channelIndex;
                                
                                if (needToResetDecoderForChannelIndex >= 0 && needToResetDecoderForChannelIndex < IMC_MAX_CHANNEL &&
                                    encodingFrame.videoFrameInfo.channelIndex == needToResetDecoderForChannelIndex)
                                {
                                    if(decoders[needToResetDecoderForChannelIndex])
                                    {
                                        [decoders[needToResetDecoderForChannelIndex] Decoder_Destroy];
                                        decoders[needToResetDecoderForChannelIndex] = nil;
                                    }
                                    needToResetDecoderForChannelIndex = -1;
                                }
                                
                                for (decoderMapping* decoderMap in decoderMappings) {
                                    
                                    if ([decoderMap.serverAddress isEqualToString:encodingFrame.videoFrameInfo.serverAddress] &&
                                        decoderMap.channelIndex == channelIndex)
                                    {
                                        existedMap = YES;
                                        channelMap = decoderMap;
                                        break;
                                    }
                                }

                                if (!existedMap || channelMap==nil)
                                {
                                    channelMap = [[decoderMapping alloc] init];
                                    channelMap.serverAddress = encodingFrame.videoFrameInfo.serverAddress;
                                    channelMap.channelIndex = encodingFrame.videoFrameInfo.channelIndex;
                                    
                                    if(videoMode == SEARCH_VIDEO && encodingFrame.videoFrameInfo.frameMode==SEARCH_VIEW)
                                        channelMap.channelIndex = IMC_MAX_CHANNEL-1;
                                    
                                    if (channelMap!=nil) {
                                        [decoderMappings addObject:channelMap];
                                    }
                                }

                                I3VDEC_PARAM param;
                                param.codecId = vedHeader->ve_format.codec_id;
                                param.codingMethod = vedHeader->ve_format.coding_method;
                                param.height = vedHeader->ve_format.y_height;
                                param.width = vedHeader->ve_format.x_width;
                                
                                if( channelMap.decoder == nil )
                                {
                                    channelMap.decoder = [[CodecfDecoder alloc] init];
                                    [channelMap.decoder Decoder_Init:&param isFullScreen:NO];
                                    channelMap.decoder.needIFrame = YES;
                                }
                                else if([channelMap.decoder isDecoderChanged:&param])
                                {
                                    [channelMap.decoder Decoder_Destroy];
                                    channelMap.decoder = nil;
                                    channelMap.decoder = [[CodecfDecoder alloc] init];
                                    [channelMap.decoder Decoder_Init:&param isFullScreen:NO];
                                    channelMap.decoder.needIFrame = YES;
                                }
                                
                                if (channelMap.decoder.needIFrame)
                                {
                                    if (IS_I_FRAME(vedHeader->array_item[0].frame_type))
                                    {
                                        
                                        channelMap.decoder.needIFrame = NO;
                                    }
                                    else
                                    {
                                        //Missing IFrame, drop all P-Frames
                                        NSLog(@"Drop All P Frames");
                                        continue;
                                    }
                                }
                                
                                if (vedHeader->array_size > 1)
                                {
                                    @autoreleasepool
                                    {
                                        I3VDEC_FRAME dFrame;
                                        NSInteger nRet = I3CODE_ERROR_OK;
                                        uint16_t width = vedHeader->ve_format.x_width;
                                        for (int i = 0; i < vedHeader->array_size; i++)    // DECODE all frames
                                        {
                                            dFrame.bitstream = (void*)(frameData.bytes + vedHeader->array_item[i].position);
                                            dFrame.length  = vedHeader->array_item[i].size;
                                            encodingFrame.header.index  = vedHeader->array_item[i].index;
                                            dFrame.colorspace = 2;
                                            dFrame.stride = width;
                                            
                                            nRet = [channelMap.decoder Decoder_Decode:&dFrame];
                                            
                                            if( I3CODE_ERROR_FAIL == nRet )  // Thang Do, changes, Jan 11, 2013, #24685
                                            {
                                                channelMap.decoder.needIFrame = YES;
                                                    break;
                                            }
                                            else if(I3CODE_ERROR_OK == nRet && i == vedHeader->array_size - 1 )
                                            {
                                                channelMap.decoder.needIFrame = NO;
                                                break;
                                            }

                                        }
                                        if(nRet==I3CODE_ERROR_FAIL)
                                            continue;
                                    }
                                }
                                else if (vedHeader->array_size == 1)
                                {
                                    I3VDEC_FRAME frame;
                                    uint16_t width = vedHeader->ve_format.x_width;
                                    frame.colorspace = 2;
                                    frame.stride = width;
                                    //NSLog(@"Frame Height: %zd, Width: %zd", vedHeader->ve_format.y_height, vedHeader->ve_format.x_width);
                                    NSInteger result  = -1;
                                    
                                    frame.bitstream = (int8_t*)frameData.bytes + vedHeader->array_item[0].position;
                                    frame.length = vedHeader->array_item[0].size;
                                    result = [channelMap.decoder Decoder_Decode:&frame];
                                    
                                    if (result != 0)
                                    {
                                        if (result == I3CODE_ERROR_FAIL)
                                        {
                                            //Missing IFrame
                                            NSLog(@"Missing IFrame");
                                            channelMap.decoder.needIFrame = YES;
                                        }
                                        NSLog(@"Decode Error for channel: %ld", (long)encodingFrame.videoFrameInfo.channelIndex);
                                        continue;
                                    }
                                    else
                                    {
                                        channelMap.decoder.lastFrameTime = vedHeader->time;
                                        channelMap.decoder.frameIndex = vedHeader->array_item[0].time_offset;
                                        channelMap.decoder.needIFrame = NO;
                                        channelMap.decoder.lastServerAddress = encodingFrame.videoFrameInfo.serverAddress;
                                        if ( encodingFrame.videoFrameInfo.frameMode == SNAPSHOT ||
                                            ( videoMode == SEARCH_VIDEO &&
                                            encodingFrame.videoFrameInfo.channelIndex == (IMC_MAX_CHANNEL-1) &&
                                            encodingFrame.videoFrameInfo.frameMode == SEARCH_VIEW) )
                                        {
                                            channelMap.decoder.lastChannelIndex = vedHeader->channel_id;
                                        }
                                        else
                                        {
                                            channelMap.decoder.lastChannelIndex = encodingFrame.videoFrameInfo.channelIndex;
                                        }
                                    }
                                }
                                else if (vedHeader->array_size > 1)
                                {
                                    break;
                                }
                                //lvxt note
                                UIImage* decodedFrame = [[UIImage alloc] initWithCGImage: channelMap.decoder.currentImage.CGImage];
                                if( decodedFrame && decodedFrame.size.width > 0 &&
                                    decodedFrame.size.height > 0 && (decodedFrame.CGImage || decodedFrame.CIImage))
                                {
                                    //@autoreleasepool
                                    {
                                        NSInteger lastIndex = 0;
                                        if(vedHeader->array_size>1)
                                            lastIndex = vedHeader->array_size-1;
                                        DisplayedVideoFrame* videoFrame = [[DisplayedVideoFrame alloc] init];
                                        
                                        videoFrame.serverAddress = encodingFrame.videoFrameInfo.serverAddress;
                                        videoFrame.serverPort = encodingFrame.videoFrameInfo.serverPort;
                                        videoFrame.channelIndex = encodingFrame.videoFrameInfo.channelIndex;
                                        videoFrame.subMainStream = ((FrameHeaderEx*)encodingFrame.header).subMainStream;
                                        if( encodingFrame.videoFrameInfo.frameMode == SNAPSHOT ||
                                            (videoMode == SEARCH_VIDEO &&
                                            encodingFrame.videoFrameInfo.channelIndex == (IMC_MAX_CHANNEL-1) &&
                                            encodingFrame.videoFrameInfo.frameMode == SEARCH_VIEW) )
                                        {
                                            videoFrame.channelIndex = vedHeader->channel_id;
                                        }
                                        videoFrame.cameraName = encodingFrame.videoFrameInfo.cameraName;
                                        videoFrame.videoFrame = decodedFrame ;
                                        videoFrame.frameTime = [NSDate dateWithTimeIntervalSince1970:vedHeader->time];
                                        videoFrame.codecId = vedHeader->ve_format.codec_id;
                                        videoFrame.resolutionHeight = vedHeader->ve_format.y_height;
                                        videoFrame.resolutionWidth = vedHeader->ve_format.x_width;
                                        videoFrame.timeOffset = vedHeader->array_item[lastIndex].time_offset;
                                        videoFrame.frameIndex = vedHeader->array_item[lastIndex].index;
                                        if(((FrameHeaderEx*)encodingFrame.header).snapshotImage)
                                            videoFrame.frameMode = SNAPSHOT;
                                        else
                                            videoFrame.frameMode = encodingFrame.videoFrameInfo.frameMode;
                                        [delegate handleCommand:IMC_CMD_DISPLAY_VIDEO :videoFrame];
                                        // dongpt: add nil
										videoFrame = nil;
                                    }
                                }
								// dongpt: nil anyway
                                // else
                                // {
                                    decodedFrame = nil;
                                // }
                            }
                                break;
                            case MJPEG_CODEC:
                            case MJPEG_CODEC_2:
                            {
                                
                                //@autoreleasepool
                                {
                                    
                                    for (decoderMapping* decoderMap in decoderMappings) {
                                        if ([decoderMap.serverAddress isEqualToString:encodingFrame.videoFrameInfo.serverAddress] &&
                                            decoderMap.channelIndex == encodingFrame.videoFrameInfo.channelIndex &&
                                            decoderMap.decoderIndex != -1 && decoderMap.decoder != NULL && decoderMap.decoder.needIFrame)
                                        {
                                            decoderMap.decoder.needIFrame = NO;
                                            break;
                                        }
                                    }
                                    
                                    //NSLog(@"Encoded Frame MJPEG_CODEC came");
                                    
                                    if( vedHeader->array_item[0].position + vedHeader->array_item[0].size > frameData.length )
                                    {
                                        NSLog(@"Invalid Size");
                                        continue;
                                    }
                                    
                                    if (vedHeader->array_item[0].position + vedHeader->array_item[0].size <=  [frameData length])
                                    {
                                        //@autoreleasepool
                                        {
                                            UIImage* decodedFrame = [UIImage imageWithData:[NSData dataWithBytes:(int8_t*)frameData.bytes + vedHeader->array_item[0].position length:vedHeader->array_item[0].size]];
                                            if( decodedFrame && decodedFrame.size.width > 0 &&
                                                decodedFrame.size.height > 0 && (decodedFrame.CGImage || decodedFrame.CIImage))
                                            {
                                                DisplayedVideoFrame* videoFrame = [[DisplayedVideoFrame alloc] init];
                                                    
                                                videoFrame.serverAddress = encodingFrame.videoFrameInfo.serverAddress;
                                                videoFrame.serverPort = encodingFrame.videoFrameInfo.serverPort;
                                                videoFrame.channelIndex = encodingFrame.videoFrameInfo.channelIndex;
                                                videoFrame.subMainStream = ((FrameHeaderEx*)encodingFrame.header).subMainStream;
                                                if ( encodingFrame.videoFrameInfo.frameMode == SNAPSHOT ||
                                                    (videoMode == SEARCH_VIDEO && encodingFrame.videoFrameInfo.channelIndex == (IMC_MAX_CHANNEL-1)&& encodingFrame.videoFrameInfo.frameMode == SEARCH_VIEW) )
                                                {
                                                    videoFrame.channelIndex = vedHeader->channel_id;
                                                }
                                                videoFrame.cameraName = encodingFrame.videoFrameInfo.cameraName;
                                                videoFrame.videoFrame = decodedFrame;
                                                videoFrame.resolutionHeight = vedHeader->ve_format.y_height;
                                                videoFrame.resolutionWidth = vedHeader->ve_format.x_width;
                                                videoFrame.codecId = vedHeader->ve_format.codec_id;
                                                videoFrame.frameTime = [NSDate dateWithTimeIntervalSince1970:vedHeader->time];
                                                videoFrame.timeOffset = vedHeader->array_item[0].time_offset;
                                                videoFrame.frameIndex = vedHeader->array_item[0].index;
                                                videoFrame.frameMode = encodingFrame.videoFrameInfo.frameMode;
                                                if(((FrameHeaderEx*)encodingFrame.header).snapshotImage)
                                                    videoFrame.frameMode = SNAPSHOT;
                                                [delegate handleCommand:IMC_CMD_DISPLAY_VIDEO :videoFrame];
												// dongpt: add nil
                                                videoFrame = nil;
                                            }
                                            else
                                            {
                                                NSLog(@"Invalid Image");
                                            }
											// dongpt: add nil
                                            decodedFrame = nil;
                                        }
                                        
                                    }
                                    
                                }
                            }
                                break;
                            default:
                                break;
                        }
                        
                    }
                    frameData =  nil;
                    encodingFrame.frameData = nil;
                    encodingFrame = nil;
                }
            }
        }
    } 
}


-(BOOL)dataIsValidJPEG:(NSData *)jpeg
{
    if ([jpeg length] < 4)
        return NO;
    const char * bytes = (const char *)[jpeg bytes];

    if ( [[NSNumber numberWithUnsignedChar:bytes[0]] intValue] != 0xFF || [[NSNumber numberWithUnsignedChar:bytes[1]] intValue] != 0xD8)
        return NO;

    if ([[NSNumber numberWithUnsignedChar:bytes[2]] intValue] != 0xFF || [[NSNumber numberWithUnsignedChar:bytes[3]] intValue] != 0xE0)
        return NO;
    return YES;
}

- (NSArray*)updateInfo
{
    //@autoreleasepool
    {
        NSMutableArray* cpuCoreList = [NSMutableArray array];
        natural_t numCPUsU = 0U;
        kern_return_t err = host_processor_info(mach_host_self(), PROCESSOR_CPU_LOAD_INFO, &numCPUsU, &cpuInfo, &numCpuInfo);
        if(err == KERN_SUCCESS && cpuInfo && numCpuInfo) {
            [CPUUsageLock lock];
            
            for(unsigned i = 0U; i < numCPUs; ++i) {
                float inUse, total;
                if(prevCpuInfo != NULL && cpuInfo != NULL && *cpuInfo) {
                    inUse = (
                             (cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_USER]   - prevCpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_USER])
                             + (cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_SYSTEM] - prevCpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_SYSTEM])
                             + (cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_NICE]   - prevCpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_NICE])
                             );
                    total = inUse + (cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_IDLE] - prevCpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_IDLE]);
                } else if (cpuInfo != NULL && *cpuInfo) {
                    inUse = cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_USER] + cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_SYSTEM] + cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_NICE];
                    total = inUse + cpuInfo[(CPU_STATE_MAX * i) + CPU_STATE_IDLE];
                }
                else
                {
                    [CPUUsageLock unlock];
                    NSLog(@"Error!");
                    return nil;
                }
                
//                NSLog(@"Core: %u Usage: %f",i,inUse / total);
                
                [cpuCoreList addObject:@(inUse / total)];
            }
            [CPUUsageLock unlock];
            
            if(prevCpuInfo) {
                size_t prevCpuInfoSize = sizeof(integer_t) * numPrevCpuInfo;
                vm_deallocate(mach_task_self(), (vm_address_t)prevCpuInfo, prevCpuInfoSize);
            }
            
            prevCpuInfo = cpuInfo;
            numPrevCpuInfo = numCpuInfo;
            
            cpuInfo = NULL;
            numCpuInfo = 0U;
            
            //free(cpuInfo);
            //free(prevCpuInfo);
            
            return cpuCoreList;
        } else {
            NSLog(@"Error!");
            return nil;
        }
        return nil;
    }
}

-(void)frameControl
{
    NSArray* cpuUsageList = [self updateInfo];
    float totalUsage = -1.0f;
    
    if (cpuUsageList && cpuUsageList.count > 0) {
        for (NSNumber* cpuUsage in cpuUsageList) {
            if ([cpuUsage isMemberOfClass:[NSNumber class]]) {
                totalUsage += [cpuUsage floatValue];
            }
        }
    }
    
    BOOL isQueueFull = [encodedFrames full];
    
    if (isQueueFull || (totalUsage != -1 && totalUsage > cpuUsageList.count * 0.9f)) {
        NSLog(@"Refresh Frame Queue");
        [encodedFrames clearQueue];
    }
}

-(void)updateFrameQueueWhenFullScreen
{
    [encodedFrames clearQueue];
}


-(void)updateFrameResolutionWithServerAddress :(NSString*)serverAddress channelIndex :(NSInteger)channelIndex isFullScreen :(BOOL)isFulllScreen isMainStream:(BOOL)isMainStream
{
    [newResolution removeAllObjects];
    
    [encodedFrames clearQueue];
    
    [newResolution addObject:serverAddress];
    [newResolution addObject:@(channelIndex)];
    [newResolution addObject:@(isFulllScreen)];
    [newResolution addObject:@(isMainStream)];
}

-(void)resetDecoderForChannelIndex:(NSInteger)channelIndex andServerAddress:(NSString*)serverAddress
{
    if (channelIndex == IMC_MAX_CHANNEL - 1) {
        [decoders[channelIndex] Decoder_Destroy];
        decoders[channelIndex] = nil;
        
    }
    else if (channelIndex >= 0 && channelIndex < IMC_MAX_CHANNEL)
    {
        for (decoderMapping* mapping in decoderMappings) {
            if (mapping.channelIndex == channelIndex && [serverAddress isEqualToString:mapping.serverAddress])
            {
                [decoders[mapping.decoderIndex] Decoder_Destroy];
                decoders[mapping.decoderIndex] = nil;
            }
        }
    }
}

-(void)releaseDecoders:(NSString *)serverAddress
{
  	// NSLog(@" qqqqqqq  releaseDecoders %@", serverAddress);
    [encodedFrames removeFramesWithCondition:^BOOL(id  _Nonnull obj) {
        EncodedFrame* _frame = (EncodedFrame*)obj;
        if([_frame.videoFrameInfo.serverAddress isEqualToString:serverAddress])
            return YES;
        return NO;
    }];
    NSMutableIndexSet* indicesForObjectsToRemove = [[NSMutableIndexSet alloc] init];
    [decoderMappings enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        
        decoderMapping* mapping = (decoderMapping*)obj ;
        if([serverAddress isEqualToString:mapping.serverAddress] && mapping.decoder != nil)
           [indicesForObjectsToRemove addIndex:idx];
        
    }];
    
    indicesOfDecoders = indicesForObjectsToRemove;
    
    //lvxt begin: will improve better
    /*NSMutableIndexSet* indicesForObjectsToRemove = [[NSMutableIndexSet alloc] init];
    [decoderMappings enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
     
                                        decoderMapping* mapping = (decoderMapping*)obj ;
                                        if([serverAddress isEqualToString:mapping.serverAddress])
                                        {
                                            if(mapping.decoder)
                                            {
                                                [mapping.decoder Decoder_Destroy];
                                                mapping.decoder = nil;
                                            }
                                            [indicesForObjectsToRemove addIndex:idx];
                                            //[decoderMappings removeObject:mapping];
                                        }
        
    }];
    [decoderMappings removeObjectsAtIndexes:indicesForObjectsToRemove];*/
    //lvxt end
}

@end


@implementation decoderMapping

@synthesize serverAddress, channelIndex, decoderIndex,decoder,willDestroy;

-(id)init
{
    self = [super init];
    if (self) {
        serverAddress = nil;
        channelIndex = -1;
        decoderIndex = -1;
        decoder = nil;
        willDestroy = NO;
    }
    return self;
}

-(void)dealloc
{
    if(decoder != nil)
       [decoder Decoder_Destroy];
}

@end




//
//  NSData+AESCrypt.h
//
//  AES Encrypt/Decrypt
//  Created by Jim Dovey and 'Jean'
//  See http://iphonedevelopment.blogspot.com/2009/02/strong-encryption-for-cocoa-cocoa-touch.html
//
//  BASE64 Encoding/Decoding
//  Copyright (c) 2001 Kyle Hammond. All rights reserved.
//  Original development by Dave Winer.
//
//  Put together by Michael Sedlaczek, Gone Coding on 2011-02-22
//

#import <Foundation/Foundation.h>

@interface NSData (AESCrypt)

- (NSData *)AES128EncryptWithKey:(NSString *)key;
- (NSData *)AES128DecryptWithKey:(NSString *)key;

- (NSData *)AES128EncryptWithKeyData:(NSData *)key;
- (NSData *)AES128DecryptWithKeyData:(NSData *)key;

+ (NSData *)dataWithBase64EncodedString:(NSString *)string;
- (id)initWithBase64EncodedString:(NSString *)string;
	
- (NSString *)base64Encoding;
- (NSString *)base64EncodingWithLineLength:(NSUInteger)lineLength;
	
- (BOOL)hasPrefixBytes:(const void *)prefix length:(NSUInteger)length;
- (BOOL)hasSuffixBytes:(const void *)suffix length:(NSUInteger)length;

@end

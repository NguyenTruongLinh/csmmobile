//
//  ImcImageView.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/18/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ImcImageView.h"

@implementation ImcImageView

@synthesize displayedImage;

- (id)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    // Initialization code
    imageRect = frame;
    imageRect.origin.x = 0;
    imageRect.origin.y = 0;
    displayedImage = nil;
    self.contentMode = UIViewContentModeScaleAspectFit;
  }
  return self;
}

- (CGRect) callDrawRect:(CGRect)rectView :(CGSize)imageSize
{
  return rectView;
}

// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect
{
  // Drawing code
  if( displayedImage )
  {
    [displayedImage drawInRect:imageRect];
    if( isTouching )
    {
      CGContextRef ctx = UIGraphicsGetCurrentContext();
      CGRect displayRect = CGRectInset(rect, 2, 2);
      CGContextSetRGBStrokeColor(ctx, 255, 0, 0, 50);
      CGContextStrokeRect(ctx, displayRect);
      //CGContextSetTextDrawingMode(ctx, )
    }
  }
}

- (void) touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  isTouching = true;
  [self setNeedsDisplay];
}

- (void) touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  isTouching = false;
  [self setNeedsDisplay];
}

- (void) touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  isTouching = false;
  [self setNeedsDisplay];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
}

@end


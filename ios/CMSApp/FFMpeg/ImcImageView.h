//
//  ImcImageView.h
//  CMSApp
//
//  Created by I3DVR on 11/28/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ImcImageView : UIView {
  CGRect      imageRect;
  bool        isTouching;
}

@property (nonatomic, retain) UIImage*    displayedImage;

- (CGRect) callDrawRect : (CGRect)rectView : (CGSize)imageSize;

@end

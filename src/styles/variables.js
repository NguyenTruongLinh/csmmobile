import {
  getwindow,
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
} from '../util/general';
import React, {Component} from 'react';
import {Platform, PixelRatio, StatusBar, View} from 'react-native';
import CMSColors from './cmscolors';
import DeviceInfo from 'react-native-device-info';

//const deviceHeight = Dimensions.get("window").height;
//const deviceWidth = Dimensions.get("window").width;
const {height: deviceHeight, width: deviceWidth} = getwindow();
const platform = Platform.OS;
const platformStyle = undefined;
const IOS_STATUS_BAR_HEIGHT = 20;
const IOS_X_STATUS_BAR_HEIGHT = 44;
const IPHONEX_PADDING_BOTTOM = 35;
const Default_BottomBar_Height = 50;
const IPhoneX_BottomBar_Height =
  Default_BottomBar_Height + IPHONEX_PADDING_BOTTOM - 15;
const line_border_height = deviceHeight / deviceWidth <= 1.6 ? 1 : 0.5;
export default {
  ModalHeight_percent: 0.8,
  bottombarheight:
    platform === 'ios'
      ? DeviceInfo.hasNotch()
        ? IPhoneX_BottomBar_Height
        : Default_BottomBar_Height
      : Default_BottomBar_Height,
  cmsheaderheight: 30,
  navigationHeight: 47,
  platformStyle,
  platform,
  horizoltalLine: (
    <View
      style={{
        borderBottomColor: CMSColors.borderColor,
        borderBottomWidth: line_border_height,
      }}
    />
  ),
  //Form Login
  width_logo_image: responsiveWidth(40),
  height_logo_image: responsiveHeight(17),
  width_i3logo_image: responsiveWidth(20),
  height_i3logo_image: responsiveHeight(8),

  fix_fontSire: 16,
  fix_width_logo: 150,
  fix_height_logo: 65,

  //Form Home
  size_icon_button_home: responsiveWidth(20),
  fontSize_buton_home: responsiveFontSize(1.5),

  //Form POS
  size_icon_empty: responsiveWidth(30),

  //Bottom Bar
  //size_icon_bottom_bar: myf.responsiveWidth(8),
  size_icon_bottom_bar: 21,

  // Component InputTextIcon
  fontSize_Icon: responsiveFontSize(2),
  fontSize_Text: responsiveFontSize(2),

  fix_fontSize_Icon: 18,

  // AndroidRipple
  androidRipple: true,
  androidRippleColor: 'rgba(256, 256, 256, 0.3)',
  androidRippleColorDark: 'rgba(0, 0, 0, 0.15)',

  // Badge
  badgeBg: '#ED1727',
  badgeColor: '#fff',
  // New Variable
  badgePadding: platform === 'ios' ? 3 : 0,

  // Button
  btnFontFamily: platform === 'ios' ? 'System' : 'Roboto_medium',
  btnDisabledBg: '#b5b5b5',
  btnDisabledClr: '#f1f1f1',

  // CheckBox
  containerPaddingBottom: 0, // platform ==='ios'? (DeviceInfo.hasNotch() ? IPHONEX_PADDING_BOTTOM : 0) :  0,
  // StatusBarHeight: platform ==='ios'? deviceHeight=== 812 && deviceWidth===375 ? IOS_X_STATUS_BAR_HEIGHT : IOS_STATUS_BAR_HEIGHT :  StatusBar.currentHeight,
  StatusBarHeight:
    platform === 'ios'
      ? DeviceInfo.hasNotch()
        ? IOS_X_STATUS_BAR_HEIGHT
        : IOS_STATUS_BAR_HEIGHT
      : StatusBar.currentHeight,
  CheckboxRadius: platform === 'ios' ? 13 : 0,
  CheckboxBorderWidth: platform === 'ios' ? 1 : 2,
  CheckboxPaddingLeft: platform === 'ios' ? 4 : 2,
  CheckboxPaddingBottom: platform === 'ios' ? 0 : 5,
  CheckboxIconSize: platform === 'ios' ? 21 : 14,
  CheckboxIconMarginTop: platform === 'ios' ? undefined : 1,
  CheckboxFontSize: platform === 'ios' ? 23 / 0.9 : 18,
  DefaultFontSize: 17,
  checkboxBgColor: '#039BE5',
  checkboxSize: 20,
  checkboxTickColor: '#fff',

  // Segment
  segmentBackgroundColor: platform === 'ios' ? '#F8F8F8' : '#3F51B5',
  segmentActiveBackgroundColor: platform === 'ios' ? '#007aff' : '#fff',
  segmentTextColor: platform === 'ios' ? '#007aff' : '#fff',
  segmentActiveTextColor: platform === 'ios' ? '#fff' : '#3F51B5',
  segmentBorderColor: platform === 'ios' ? '#007aff' : '#fff',
  segmentBorderColorMain: platform === 'ios' ? '#a7a6ab' : '#3F51B5',

  // New Variable
  get defaultTextColor() {
    return this.textColor;
  },

  get btnPrimaryBg() {
    return this.brandPrimary;
  },
  get btnPrimaryColor() {
    return this.inverseTextColor;
  },
  get btnInfoBg() {
    return this.brandInfo;
  },
  get btnInfoColor() {
    return this.inverseTextColor;
  },
  get btnSuccessBg() {
    return this.brandSuccess;
  },
  get btnSuccessColor() {
    return this.inverseTextColor;
  },
  get btnDangerBg() {
    return this.brandDanger;
  },
  get btnDangerColor() {
    return this.inverseTextColor;
  },
  get btnWarningBg() {
    return this.brandWarning;
  },
  get btnWarningColor() {
    return this.inverseTextColor;
  },
  get btnTextSize() {
    return platform === 'ios' ? this.fontSizeBase * 1.1 : this.fontSizeBase - 1;
  },
  get btnTextSizeLarge() {
    return this.fontSizeBase * 1.5;
  },
  get btnTextSizeSmall() {
    return this.fontSizeBase * 0.8;
  },
  get borderRadiusLarge() {
    return this.fontSizeBase * 3.8;
  },

  buttonPadding: 6,

  get iconSizeLarge() {
    return this.iconFontSize * 1.5;
  },
  get iconSizeSmall() {
    return this.iconFontSize * 0.6;
  },

  // Card
  cardDefaultBg: '#fff',

  // Color
  brandPrimary: platform === 'ios' ? '#007aff' : '#3F51B5',
  brandInfo: '#62B1F6',
  brandSuccess: '#5cb85c',
  brandDanger: '#d9534f',
  brandWarning: '#f0ad4e',
  brandSidebar: '#252932',

  // Font
  fontFamily: platform === 'ios' ? 'System' : 'Roboto',
  fontSizeBase: 15,

  get fontSizeH1() {
    return this.fontSizeBase * 1.8;
  },
  get fontSizeH2() {
    return this.fontSizeBase * 1.6;
  },
  get fontSizeH3() {
    return this.fontSizeBase * 1.4;
  },

  // Footer
  footerHeight: 55,
  footerDefaultBg: platform === 'ios' ? '#F8F8F8' : '#4179F7',

  // FooterTab
  tabBarTextColor: platform === 'ios' ? '#6b6b6b' : '#b3c7f9',
  tabBarTextSize: platform === 'ios' ? 14 : 11,
  activeTab: platform === 'ios' ? '#007aff' : '#fff',
  sTabBarActiveTextColor: '#007aff',
  tabBarActiveTextColor: platform === 'ios' ? '#007aff' : '#fff',
  tabActiveBgColor: platform === 'ios' ? '#cde1f9' : '#3F51B5',

  // Tab
  tabDefaultBg: platform === 'ios' ? '#F8F8F8' : '#3F51B5',
  topTabBarTextColor: platform === 'ios' ? '#6b6b6b' : '#b3c7f9',
  topTabBarActiveTextColor: platform === 'ios' ? '#007aff' : '#fff',
  topTabActiveBgColor: platform === 'ios' ? '#cde1f9' : undefined,
  topTabBarBorderColor: platform === 'ios' ? '#a7a6ab' : '#fff',
  topTabBarActiveBorderColor: platform === 'ios' ? '#007aff' : '#fff',

  // Header
  toolbarBtnColor: platform === 'ios' ? '#007aff' : '#fff',
  toolbarDefaultBg: platform === 'ios' ? '#F8F8F8' : '#3F51B5',
  toolbarHeight: platform === 'ios' ? 64 : 56,
  toolbarIconSize: platform === 'ios' ? 20 : 22,
  toolbarSearchIconSize: platform === 'ios' ? 20 : 23,
  toolbarInputColor: platform === 'ios' ? '#CECDD2' : '#fff',
  searchBarHeight: platform === 'ios' ? 30 : 40,
  toolbarInverseBg: '#222',
  toolbarTextColor: platform === 'ios' ? '#000' : '#fff',
  toolbarDefaultBorder: platform === 'ios' ? '#a7a6ab' : '#3F51B5',
  iosStatusbar: platform === 'ios' ? 'dark-content' : 'light-content',
  get statusBarColor() {
    return color(this.toolbarDefaultBg).darken(0.2).hex();
  },

  // Icon
  iconFamily: 'Ionicons',
  iconFontSize: platform === 'ios' ? 30 : 28,
  iconMargin: 7,
  iconHeaderSize: platform === 'ios' ? 33 : 24,

  // InputGroup
  inputFontSize: 17,
  inputBorderColor: '#D9D5DC',
  inputSuccessBorderColor: '#2b8339',
  inputErrorBorderColor: '#ed2f2f',

  get inputColor() {
    return this.textColor;
  },
  get inputColorPlaceholder() {
    return '#575757';
  },

  inputGroupMarginBottom: 10,
  inputHeightBase: 50,
  inputPaddingLeft: 5,

  get inputPaddingLeftIcon() {
    return this.inputPaddingLeft * 8;
  },

  // Line Height
  btnLineHeight: 19,
  lineHeightH1: 32,
  lineHeightH2: 27,
  lineHeightH3: 22,
  iconLineHeight: platform === 'ios' ? 37 : 30,
  lineHeight: platform === 'ios' ? 20 : 24,

  // List
  listBg: '#fff',
  listBorderColor: '#c9c9c9',
  listDividerBg: '#f4f4f4',
  listItemHeight: 45,
  listBtnUnderlayColor: '#DDD',

  // Card
  cardBorderColor: '#ccc',

  // Changed Variable
  listItemPadding: platform === 'ios' ? 10 : 12,

  listNoteColor: '#808080',
  listNoteSize: 13,

  // Progress Bar
  defaultProgressColor: '#E4202D',
  inverseProgressColor: '#1A191B',

  // Radio Button
  radioBtnSize: platform === 'ios' ? 25 : 23,
  radioSelectedColorAndroid: '#3F51B5',

  // New Variable
  radioBtnLineHeight: platform === 'ios' ? 29 : 24,

  radioColor: '#7e7e7e',

  get radioSelectedColor() {
    return color(this.radioColor).darken(0.2).hex();
  },

  // Spinner
  defaultSpinnerColor: '#45D56E',
  inverseSpinnerColor: '#1A191B',

  // Tabs
  tabBgColor: '#F8F8F8',
  tabFontSize: 15,
  tabTextColor: '#222222',

  // Text
  textColor: '#000',
  inverseTextColor: '#fff',
  noteFontSize: 14,

  // Title
  titleFontfamily: platform === 'ios' ? 'System' : 'Roboto_medium',
  titleFontSize: platform === 'ios' ? 17 : 19,
  subTitleFontSize: platform === 'ios' ? 12 : 14,
  subtitleColor: platform === 'ios' ? '#8e8e93' : '#FFF',

  // New Variable
  titleFontColor: platform === 'ios' ? '#000' : '#FFF',

  // Other
  borderRadiusBase: platform === 'ios' ? 5 : 2,
  borderWidth: 1 / PixelRatio.getPixelSizeForLayoutSize(1),
  contentPadding: 10,

  get darkenHeader() {
    return color(this.tabBgColor).darken(0.03).hex();
  },

  // Line border width
  borderWidthRow: line_border_height,

  dropdownBg: '#000',
  dropdownLinkColor: '#414142',
  inputLineHeight: 24,
  jumbotronBg: '#C9C9CE',
  jumbotronPadding: 30,
  deviceWidth,
  deviceHeight,
  isPhoneX: platform === 'ios' && DeviceInfo.hasNotch(), // deviceHeight=== 812 && deviceWidth===375  ? true : false,
  isIpad:
    platform === 'ios' && deviceHeight / deviceWidth <= 1.6 ? true : false,

  isIOS: platform === 'ios' ? true : false,
  // New Variable
  inputGroupRoundedBorderRadius: 30,
  device_max_width: 600,
  iPhoneNotchHeight: IOS_X_STATUS_BAR_HEIGHT,

  //device_max_width: 160   // mobile Portrail
  // max-width: 480px (di?n tho?i di d?ng, hi?n th? chi?u ngang)
  // max-width: 600px (m�y t�nh b?ng, hi?n th? chi?u d?c)
  // max-width: 800px (m�y t�nh b?ng, hi?n th? chi?u ngang)
  // max-width: 768px (m�y t�nh b?ng lo?i to, hi?n th? chi?u d?c)
  // max-width: 1024px (m�y t�nh b?ng lo?i to, hi?n th? chi?u ngang)
  // min-width: 1025px (t? size n�y tr? l�n l� danh cho desktop th�ng thu?ng).

  errorLogStyle: 'color: red; font-style: bold',
};

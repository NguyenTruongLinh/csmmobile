import CMSColors from './cmscolors';

const theme = {
  light: {
    container: {
      backgroundColor: CMSColors.White,
    },
    text: {
      color: CMSColors.ColorText,
    },
    iconTabBarActive: CMSColors.PrimaryActive,
    iconTabBarInactive: CMSColors.SecondaryText,
    textTabBarActive: {
      color: CMSColors.PrimaryActive,
    },
    textTabBarInactive: {
      color: CMSColors.SecondaryText,
    },
    videoConnectionLittleText: {
      color: CMSColors.RowOptions,
    },
    iconColor: CMSColors.PrimaryText,
    borderColor: {
      borderColor: CMSColors.Alto,
    },
    baseColor: CMSColors.SecondaryText,
    alarmInfoContainer: {
      backgroundColor: CMSColors.FilterRowBg,
    },
    modalContainer: {
      backgroundColor: CMSColors.White,
    },
    posExceptionModalSubHeader: {
      backgroundColor: CMSColors.FilterRowBg,
    },
    inputIconColor: CMSColors.InputIconColor,
    loginSubText: {
      color: CMSColors.PrimaryText,
    },
    backIconColor: CMSColors.PrimaryText,
    contactI3SubText: {
      color: CMSColors.SecondaryText,
    },
    slideDotInactive: CMSColors.Inactive,
    slideDotActive: CMSColors.White,
    alarmDetailColor: {
      color: CMSColors.PrimaryText,
    },
    radioColor: CMSColors.ColorText,
    homeHeaderRow: {
      backgroundColor: CMSColors.White,
    },
    textCalendarDisabledColor: CMSColors.DividerColor,
    headerListRow: {
      backgroundColor: CMSColors.HeaderListRow,
    },
  },
  dark: {
    container: {
      backgroundColor: CMSColors.CodGray,
    },
    text: {
      color: CMSColors.White_Op85,
    },
    iconTabBarActive: CMSColors.White,
    iconTabBarInactive: CMSColors.White_Op30,
    textTabBarActive: {
      color: CMSColors.White,
    },
    textTabBarInactive: {
      color: CMSColors.White_Op30,
    },
    videoConnectionLittleText: {
      color: CMSColors.White_Op85,
    },
    iconColor: CMSColors.White_Op85,
    borderColor: {
      borderColor: CMSColors.MineShaft,
    },
    baseColor: CMSColors.White_Op50,
    alarmInfoContainer: {
      backgroundColor: CMSColors.CodGray,
    },
    modalContainer: {
      backgroundColor: CMSColors.CodGray_2,
    },
    posExceptionModalSubHeader: {
      backgroundColor: CMSColors.MineShaft_2,
    },
    inputIconColor: CMSColors.White_Op50,
    loginSubText: {
      color: CMSColors.White_Op50,
    },
    backIconColor: CMSColors.White,
    contactI3SubText: {
      color: CMSColors.White_Op50,
    },
    slideDotInactive: CMSColors.SecondaryText,
    slideDotActive: CMSColors.ColorText,
    alarmDetailColor: {
      color: CMSColors.DividerColor,
    },
    radioColor: CMSColors.White,
    homeHeaderRow: {
      backgroundColor: CMSColors.MineShaft_2,
    },
    textCalendarDisabledColor: CMSColors.White_Op30,
    headerListRow: {
      backgroundColor: CMSColors.MineShaft_2,
    },
  },
};

export default theme;

import {Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: CMSColors.DarkTheme,
  },
  datetimeContainer: {
    flex: 10,
    flexDirection: 'row',
    margin: 28,
    backgroundColor: CMSColors.DarkElement,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  datetimeContainerFullscreen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 140,
  },
  datetime: {
    textAlign: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    color: CMSColors.White,
  },
  calendarContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calendar: {
    flex: 1,
  },
  playerContainer: {
    flex: 44,
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  controlButtonContainer: {
    position: 'absolute',
    width: '10%',
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    color: CMSColors.White,
    padding: 7,
  },
  pauseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    color: CMSColors.White,
  },
  buttonsContainers: {
    flex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: CMSColors.DarkElement,
  },
  buttonsContainersFullscreen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonWrap: {
    paddingRight: 25,
  },
  buttonStyle: {},
  timelineContainer: {
    flex: 8,
    backgroundColor: CMSColors.DarkElement,
  },
  rulerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeOnRuler: {
    backgroundColor: CMSColors.Transparent,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
  },
  channelContainer: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    backgroundColor: CMSColors.DarkTheme,
  },
  selectedChannelName: {
    fontSize: 14,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.White,
    justifyContent: 'center',
  },
  normalChannelName: {
    fontSize: 12,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.SecondaryText,
    justifyContent: 'center',
  },
  channelsListContainer: {
    flex: 30,
    justifyContent: 'center',
  },
  headerContainerFullscreen: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    top: 0,
    left: 0,
    width: '100%',
    height: '15%',
    backgroundColor: CMSColors.PrimaryText,
    opacity: 0.8,
    zIndex: 1,
  },
  headerBack: {justifyContent: 'flex-start', paddingLeft: 20},
  headerTitleWrap: {justifyContent: 'center', alignContent: 'center'},
  headerTitleText: {
    fontSize: 24,
    color: CMSColors.White,
    paddingLeft: 20,
  },
  footerContainerFullscreen: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    width: '100%',
    height: '20%',
    backgroundColor: CMSColors.PrimaryText,
    opacity: 0.8,
    zIndex: 1,
  },
  footerButtonsWrap: {
    flex: 30,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  left: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    ...Platform.select({
      android: {
        marginTop: 10,
      },
    }),
  },
  contentIcon: {
    paddingTop: 2,
  },
  title: {
    marginLeft: 5,
  },
  footerScreenTimelineContainer: {flex: 70, alignContent: 'flex-start'},
  timlineNoView: {flex: 8},
});

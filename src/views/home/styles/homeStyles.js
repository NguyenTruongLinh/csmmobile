import {Platform, StyleSheet} from 'react-native';
import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flex: 5,
  },
  footer: {
    flex: 9,
    flexDirection: 'row',
  },
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: '76%',
    backgroundColor: CMSColors.HomeHeader,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topWidgetsContainer: {
    flex: 30,
    margin: 25,
    padding: 20,
    borderRadius: 16,

    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowRadius: 10,
        shadowColor: CMSColors.BoxShadow,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  topWidgetTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: CMSColors.Dark_Blue,
  },
  leftWidget: {flex: 1, marginRight: 14},
  rightWidget: {flex: 1, marginLeft: 14},
  normalWidgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  widgetRow: {
    flex: 28,
    flexDirection: 'row',
    margin: 25,
    marginTop: 0,
  },
});

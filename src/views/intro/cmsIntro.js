import React, {Component} from 'react';
import {
  View,
  SafeAreaView,
  Image,
  Text,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {normalize} from '../../util/general';
import {LiquidLike} from 'react-native-animated-pagination-dots';

// import appStore from '../../stores/appStore';

import Button from '../../components/controls/Button';

import {
  Intro_Begin,
  Intro_Health,
  Intro_Video,
  Intro_Smarter,
  Intro_OAM,
  I3_Logo,
} from '../../consts/images';
import CMSColors from '../../styles/cmscolors';
// import styles from '../../styles/scenes/intro.style';

const IntroData = [
  {
    key: 1,
    title: 'Combine SRX Pro with CMS',
    description: 'Combine SRX Pro with CMS to enhance our mobile app',
    image: Intro_Begin,
  },
  {
    key: 2,
    title: 'Video Management',
    description: 'Live and Playback video monitoring',
    image: Intro_Video,
  },
  {
    key: 3,
    title: 'Smart-ER',
    description: 'POS exceptions report along with corresponding video',
    image: Intro_Smarter,
  },
  {
    key: 4,
    title: 'Occupancy Monitoring',
    description: 'Live Occupancy Alert Monitoring ',
    image: Intro_OAM,
  },
  {
    key: 5,
    title: 'Health Monitoring',
    description:
      'Provide health status of video system via reports and notifications',
    image: Intro_Health,
  },
];

const {width} = Dimensions.get('window');

class CMSIntroView extends Component {
  constructor(props) {
    super(props);
    this.currentIndex = 0;
    this.introList = null;
    this.scrollX = new Animated.Value(0);
    this.state = {showBackButton: false, showGetStartedButton: false};
  }

  componentDidMount() {
    __DEV__ && console.log('CMSIntroView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('CMSIntroView componentWillUnmount');
  }

  onIntroItemChanged = ({viewableItems}) => {
    __DEV__ && console.log('GOND onIntroItemChanged ', viewableItems);
    this.currentIndex = viewableItems[viewableItems.length - 1].index;
    this.setState({
      showBackButton: this.currentIndex > 0,
      showGetStartedButton: this.currentIndex == IntroData.length - 1,
    });
  };

  onSkipIntro = () => {
    // this.props.appStore.skipIntro();
    this.props.appStore.skipIntro();
  };

  onNextStep = () => {
    // __DEV__ && console.log('GOND onNextStep = ', this.currentIndex);
    if (this.introList && this.currentIndex < IntroData.length - 1) {
      this.introList.scrollToIndex({index: this.currentIndex + 1});
    } else if (this.currentIndex == IntroData.length - 1) {
      this.onSkipIntro();
    }
  };

  onEndReached = () => {
    __DEV__ && console.log('GOND onEndReached = ', this.currentIndex);
    // this.onSkipIntro();
  };

  onBackStep = () => {
    if (this.introList && this.currentIndex > 0) {
      this.introList.scrollToIndex({index: this.currentIndex - 1});
    }
  };

  handleScroll = event => {
    // Save the x (horizontal) value each time a scroll occurs
    // __DEV__ && console.log('GOND handleScroll, nativeEvent = ', event.nativeEvent);
    this.scrollX.setValue(event.nativeEvent.contentOffset.x);
  };

  renderIntroItem = ({item, index}) => {
    // this.currentIndex = index;
    let dim = Dimensions.get('window');
    return (
      <View
        style={[
          styles.listItemContainer,
          {
            width: dim.width + 2, // Fix onViewableItemsChanged viewitems contain not reached view
          },
        ]}>
        {/* <Image
          style={styles.logoImage}
          source={I3_Logo}
          width={dim.width * 0.5}
          resizeMode="contain"
        /> */}
        <Image
          style={styles.itemImage}
          source={item.image}
          width={dim.width * 0.7}
          resizeMode="contain"
        />
        <View style={[styles.itemTextContainer]}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
        </View>
      </View>
    );
  };

  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          <View style={styles.skipContainer}>
            <Button
              style={{width: '20%'}}
              enable={true}
              type={'flat'}
              caption={'SKIP'}
              onPress={this.onSkipIntro}
              captionStyle={styles.buttonCaption}
            />
          </View>
          <View style={styles.listContainer}>
            <FlatList
              data={IntroData}
              pagingEnabled={true}
              horizontal={true}
              onScroll={this.handleScroll}
              onViewableItemsChanged={this.onIntroItemChanged}
              onEndReached={this.onEndReached}
              showsHorizontalScrollIndicator={false}
              renderItem={this.renderIntroItem}
              ref={r => (this.introList = r)}
            />
          </View>
          <View style={styles.indicatorContainer}>
            <LiquidLike
              data={IntroData}
              scrollX={this.scrollX}
              scrollOffset={this.scrollX}
              inActiveDotColor={CMSColors.Inactive}
              activeDotColor={CMSColors.PrimaryActive}
              strokeWidth={3}
            />
          </View>

          <View style={styles.footerContainer}>
            <View style={styles.backContainer}>
              {this.state.showBackButton && (
                <Button
                  enable={true}
                  style={styles.backButton}
                  type={'flat'}
                  caption={'BACK'}
                  onPress={this.onBackStep}
                  captionStyle={styles.buttonCaption}
                />
              )}
            </View>
            <View style={styles.nextContainer}>
              <Button
                enable={true}
                style={[
                  styles.nextButton,
                  // {minWidth: this.state.showGetStartedButton ? 150 : 100},
                ]}
                // type={'primary'}
                type={'primary'}
                caption={
                  this.state.showGetStartedButton ? 'GET STARTED' : 'NEXT'
                }
                captionStyle={styles.buttonCaption}
                onPress={this.onNextStep}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {flex: 1, flexDirection: 'column'},
  listItemContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    flex: 3,
    tintColor: CMSColors.Dark_Blue,
  },
  itemImage: {
    flex: 6,
  },
  itemTextContainer: {
    flex: 4,
    justifyContent: 'center',
  },
  itemTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    // paddingTop: 7,
    // paddingLeft: 35,
    // paddingRight: 35,
    paddingHorizontal: 35,
    fontFamily: 'Roboto-Regular',
  },
  itemDesc: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    // paddingTop: 21,
    // paddingLeft: 56,
    // paddingRight: 56,
    paddingHorizontal: 56,
    flexWrap: 'wrap',
    fontFamily: 'Roboto-Regular',
    marginTop: 20,
  },
  skipContainer: {
    flex: 1,
    alignItems: 'flex-end',
    // marginRight: 35,
    // marginTop: 28,
  },
  listContainer: {
    flex: 13,
  },
  indicatorContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backContainer: {flex: 1, alignContent: 'flex-start'},
  backButton: {
    // height: 63,
    // marginLeft: 28,
    // marginRight: 49,
    // marginHorizontal: 24,
    margin: 16,
    alignSelf: 'flex-start',
    minWidth: 127,
  },
  nextContainer: {flex: 1, alignContent: 'flex-end'},
  nextButton: {
    // backgroundColor: CMSColors.PrimaryActive,
    height: 48,
    width: Platform.OS === 'android' && width < 600 ? 136 : 148,
    // marginLeft: 49,
    // marginRight: 35,
    marginHorizontal: 24,
    alignSelf: 'flex-end',
  },
  buttonCaption: {
    fontSize: normalize(14),
    fontWeight: 'bold',
  },
});

export default inject('appStore')(observer(CMSIntroView));

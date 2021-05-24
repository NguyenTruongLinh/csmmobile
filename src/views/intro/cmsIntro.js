import React, {Component} from 'react';
import {View, Image, Text, FlatList, Animated, Dimensions} from 'react-native';

import {LiquidLike} from 'react-native-animated-pagination-dots';

// import {} from '../../navigation/navigationService';

import Button from '../../components/controls/Button';
import CMSColors from '../../styles/cmscolors';

const IntroData = [
  {
    key: 1,
    title: 'Combine SRX Pro with CMS',
    description: 'Combine SRX Pro with CMS to enhance our mobile app',
    image: require('../../assets/images/intro/intro.png'),
    uri: '../../assets/images/intro/intro.png',
  },
  {
    key: 2,
    title: 'Health monitoring',
    description:
      'Provide health status of video system via report and notification',
    image: require('../../assets/images/intro/health.png'),
  },
  {
    key: 3,
    title: 'Video monitoring',
    description: 'Live and Playback video monitoring',
    image: require('../../assets/images/intro/video.png'),
  },
  {
    key: 4,
    title: 'Smart-ER report',
    description: 'POS exceptions report along with corresponding video',
    image: require('../../assets/images/intro/smarter.png'),
  },
  {
    key: 5,
    title: 'Occupancy monitoring',
    description: 'Live Occupancy Alert Monitoring ',
    image: require('../../assets/images/intro/oam.png'),
  },
];

class CMSIntroView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentIndex: 0,
    };

    this.introList = null;
    this.scrollX = new Animated.Value(0);
  }

  componentDidMount() {
    __DEV__ && console.log('CMSIntroView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('CMSIntroView componentWillUnmount');
  }

  onIntroItemChanged = ({viewableItems}) => {
    console.log('GOND onIntroItemChanged ', viewableItems);
    this.setState({currentIndex: viewableItems[0].index});
    // this.currentIndex = IntroData.findIndex(
    //   item => item.key == viewableItems[0].key
    // );
    console.log('GOND onIntroItemChanged currentIndex = ', this.currentIndex);
  };

  onSkipIntro = () => {};

  onNextStep = () => {
    if (this.introList && this.state.currentIndex < IntroData.length - 1)
      this.introList.scrollToIndex({index: this.state.currentIndex + 1});
    else if (this.state.currentIndex == IntroData.length - 1) {
    }
  };

  onBackStep = () => {
    if (this.introList && this.state.currentIndex > 0)
      this.introList.scrollToIndex({index: this.state.currentIndex - 1});
  };

  handleScroll = event => {
    // Save the x (horizontal) value each time a scroll occurs
    // console.log('GOND handleScroll, nativeEvent = ', event.nativeEvent);
    this.scrollX.setValue(event.nativeEvent.contentOffset.x);
  };

  renderIntroItem = ({item, index}) => {
    // this.currentIndex = index;
    let dim = Dimensions.get('window');
    console.log('GOND intro dim = ', dim);
    console.log('GOND intro item = ', item);
    return (
      <View
        style={{
          flex: 1,
          width: dim.width,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Image
          // should not set marginLeft, edit image instead
          style={{flex: 7}}
          source={item.image}
          width={dim.width * 0.7}
          resizeMode="contain"
        />
        <View
          style={{
            flex: 3,
            justifyContent: 'center',
            width: dim.width,
          }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 24,
              fontWeight: '700',
              paddingTop: 7,
              paddingLeft: 35,
              paddingRight: 35,
              fontFamily: 'Roboto-Regular',
            }}>
            {item.title}
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 16,
              fontWeight: '400',
              lineHeight: 24,
              paddingTop: 21,
              paddingLeft: 56,
              paddingRight: 56,
              flexWrap: 'wrap',
              fontFamily: 'Roboto-Regular',
            }}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  render() {
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View
          style={{
            flex: 1,
            alignItems: 'flex-end',
            marginRight: 35,
            marginTop: 28,
          }}>
          <Button
            enable={true}
            type={'flat'}
            caption={'SKIP'}
            captionStyle={{
              fontWeight: '500',
              fontSize: 16,
              color: CMSColors.primaryActive,
            }}
          />
        </View>
        <View style={{flex: 8}}>
          <FlatList
            data={IntroData}
            pagingEnabled={true}
            horizontal={true}
            // onScroll={Animated.event(
            //   [{nativeEvent: {contentOffset: {x: scrollX}}}],
            //   {
            //     useNativeDriver: false,
            //   }
            // )}
            onScroll={this.handleScroll}
            onViewableItemsChanged={this.onIntroItemChanged}
            showsHorizontalScrollIndicator={false}
            renderItem={this.renderIntroItem}
            ref={r => (this.introList = r)}
          />
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <LiquidLike
            data={IntroData}
            scrollX={this.scrollX}
            scrollOffset={this.scrollX}
            inActiveDotColor={CMSColors.inactive}
            activeDotColor={CMSColors.primaryActive}
            strokeWidth={3}
          />
        </View>

        <View
          style={{
            flex: 2,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View style={{flex: 1, alignContent: 'flex-start'}}>
            {this.state.currentIndex > 0 ? (
              <Button
                enable={true}
                style={{
                  height: 63,
                  marginLeft: 28,
                  marginRight: 49,
                }}
                type={'flat'}
                caption={'< BACK'}
                captionStyle={{
                  fontWeight: '500',
                  fontSize: 16,
                  color: CMSColors.primaryActive,
                }}
                onPress={this.onBackStep}
              />
            ) : null}
          </View>
          <View style={{flex: 1, alignContent: 'flex-end'}}>
            <Button
              enable={true}
              style={{
                backgroundColor: CMSColors.primaryActive,
                height: 65,
                marginLeft: 49,
                marginRight: 35,
                borderRadius: 2,
              }}
              type={'primary'}
              caption={'NEXT'}
              styleCaption={{
                fontWeight: '500',
                fontSize: 16,
                color: CMSColors.White,
                justifyContent: 'center',
              }}
              onPress={this.onNextStep}
            />
          </View>
        </View>
      </View>
    );
  }
}

export default CMSIntroView;

import React, {Component} from 'react';
import {View, Image, Text, FlatList, Animated, Dimensions} from 'react-native';
import {inject} from 'mobx-react';

import {LiquidLike} from 'react-native-animated-pagination-dots';

// import appStore from '../../stores/appStore';
// import {} from '../../navigation/navigationService';

import Button from '../../components/controls/Button';

import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/intro.style';

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
    // console.log('GOND onIntroItemChanged ', viewableItems);
    this.setState({currentIndex: viewableItems[0].index});
    // console.log('GOND onIntroItemChanged currentIndex = ', this.currentIndex);
  };

  onSkipIntro = () => {
    console.log('GOND appStore = ', this.props);
    // this.props.appStore.skipIntro();
    this.props.appStore.skipIntro();
  };

  onNextStep = () => {
    if (this.introList && this.state.currentIndex < IntroData.length - 1)
      this.introList.scrollToIndex({index: this.state.currentIndex + 1});
    else if (this.state.currentIndex == IntroData.length - 1) {
      this.onSkipIntro();
    }
  };

  onBackStep = () => {
    if (this.introList && this.state.currentIndex > 0)
      this.introList.scrollToIndex({index: this.state.currentIndex - 1});
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
            width: dim.width,
          },
        ]}>
        <Image
          style={styles.itemImage}
          source={item.image}
          width={dim.width * 0.7}
          resizeMode="contain"
        />
        <View
          style={[
            styles.itemTextContainer,
            //{
            // width: dim.width,
            //}
          ]}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
        </View>
      </View>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.skipContainer}>
          <Button
            style={{width: '20%'}}
            enable={true}
            type={'flat'}
            caption={'SKIP'}
            onPress={this.onSkipIntro}
          />
        </View>
        <View style={{flex: 8}}>
          <FlatList
            data={IntroData}
            pagingEnabled={true}
            horizontal={true}
            onScroll={this.handleScroll}
            onViewableItemsChanged={this.onIntroItemChanged}
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
            inActiveDotColor={CMSColors.inactive}
            activeDotColor={CMSColors.primaryActive}
            strokeWidth={3}
          />
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.backContainer}>
            {this.state.currentIndex > 0 ? (
              <Button
                enable={true}
                style={styles.backButton}
                type={'flat'}
                caption={'< BACK'}
                onPress={this.onBackStep}
              />
            ) : null}
          </View>
          <View style={styles.nextContainer}>
            <Button
              enable={true}
              style={styles.nextButton}
              type={'primary'}
              caption={'NEXT'}
              onPress={this.onNextStep}
            />
          </View>
        </View>
      </View>
    );
  }
}

export default inject('appStore')(CMSIntroView);

import React, {Component} from 'react';
import {
  View,
  Image,
  Text,
  FlatList,
  Animated,
  // Modal as ModalBase,
  TouchableOpacity,
  BackHandler,
} from 'react-native';

import Button from '../../components/controls/Button';

import CMSColors from '../../styles/cmscolors';
const introImg = require('../../assets/images/intro/intro.png');

const IntroData = [
  {
    key: 1,
    title: 'Combine SRX Pro with CMS',
    description: 'Combine SRX Pro with CMS to enhance our mobile app',
    image: introImg, // require('../../assets/images/intro/intro.png'),
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
    this.currentIndex = 0;
  }

  componentDidMount() {
    __DEV__ && console.log('CMSIntroView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('CMSIntroView componentWillUnmount');
  }

  onIntroItemChanged = ({viewableItems}) => {
    console.log('GOND onIntroItemChanged ', viewableItems);
    // this.currentIndex = parseInt(viewableItems[0].key) - 1;
    this.currentIndex = IntroData.findIndex(
      item => item.key == viewableItems[0].key
    );
  };

  onSkipIntro = () => {};

  renderIntroItem = (item, index) => {
    // this.currentIndex = index;
    console.log('GOND intro img = ', introImg);
    console.log('GOND intro item = ', item);
    return (
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Image
          source={{uri: item.uri}}
          style={{width: '100%'}}
          resizeMode={'cover'}
        />
        <Text style={{fontSize: 12, fontWeight: 'bold', color: 'black'}}>
          {item.title}
        </Text>
        <Text>{item.description}</Text>
      </View>
    );
  };

  render() {
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{}}>
          <Button style={{}} type={'flat'} caption={'SKIP'} captionStyle={{}} />
        </View>
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
          onViewableItemsChanged={this.onIntroItemChanged}
          showsHorizontalScrollIndicator={true}
          renderItem={this.renderIntroItem}
        />
        <View style={{}}>
          {this.currentIndex > 0 ? (
            <Button
              style={{}}
              type={'flat'}
              caption={'< BACK'}
              captionStyle={{}}
            />
          ) : null}
          <Button
            style={{}}
            type={'primary'}
            caption={'NEXT'}
            captionStyle={{backgroundColor: CMSColors.BlueSky}}
          />
        </View>
      </View>
    );
  }
}

export default CMSIntroView;

import React, {Component, PropTypes} from 'react';
import {
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Keyboard,
  FlatList,
  Modal,
  Button,
} from 'react-native';
import CMSColors from '../../styles/cmscolors';
import Carousel from 'react-native-snap-carousel';

export default class CMSNumberPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected,
    };
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    __DEV__ &&
      console.log(
        `CMSNumberPicker timepicker componentDidMount selected = `,
        this.state.selected,
        'this._carousel = ',
        this._carousel
      );
    this._carousel.snapToItem(this.state.selected);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // static getDerivedStateFromProps(nextProps) {
  //   return {
  //     selected: nextProps.selected,
  //   };
  // }

  renderItem = ({item, index}) => {
    return (
      <TouchableOpacity
        // onPress={() => {
        //   this.props.onSelectNumber(item, index);
        //   this.setState({selected: item});
        // }}
        style={{
          // backgroundColor:
          //   item == this.state.selected
          //     ? CMSColors.DisableItemColor
          //     : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
          // borderColor: 'red',
          // borderWidth: 1,
          height: 40,
        }}>
        <Text
          style={{
            color: index == CMSColors.PrimaryText, //this.state.midIndex ? 'red' : 'green', //
            fontSize: 30,
            fontWeight: 'bold',
          }}>
          {item < 10 ? '0' + item : item}
        </Text>
      </TouchableOpacity>
    );
  };

  onScroll = event => {
    const scrollOffset = event.nativeEvent.contentOffset.y;
    __DEV__ && console.log(` scrollOffset = `, scrollOffset);
    let tmp = scrollOffset / 40;
    if (tmp - Math.floor(tmp) > 0.5) {
      let mid = Math.floor(scrollOffset / 40) + 2;
      this.setState({midIndex: mid});
    }
  };

  onViewableItemsChanged = ({viewableItems, changed}) => {
    console.log(
      'onViewableItemsChanged Changed in this iteration viewableItems',
      viewableItems
    );
    let mid = Math.floor(
      (viewableItems[0].index + viewableItems[viewableItems.length - 1].index) /
        2
    );
    // console.log(
    //   'onViewableItemsChanged Visible items are',
    //   viewableItems
    //   // 'mid = ',
    //   // mid
    // );
    this.setState({midIndex: mid});
  };

  onSnapToItem = index => {
    this.props.onSelectNumber(this.props.numbers[index], index);
    // this.setState({selected: this.props.numbers[index]});
    // this.setState({midIndex: index});
  };

  // onBeforeSnapToItem = slideIndex => {
  //   // this.setState({midIndex: slideIndex});
  // };

  render() {
    const {numbers, slideHeight} = this.props;
    __DEV__ &&
      console.log(
        'onPress render this.state.selected',
        `this.state.selected=${this.state.selected}`
      );
    __DEV__ &&
      console.log(
        `render this.onViewableItemsChanged = `,
        this.onViewableItemsChanged
      );
    return (
      <Carousel
        ref={c => {
          this._carousel = c;
        }}
        data={numbers}
        renderItem={this.renderItem}
        sliderHeight={slideHeight}
        itemHeight={40}
        vertical={true}
        enableMomentum={true}
        onSnapToItem={this.onSnapToItem}
        onBeforeSnapToItem={this.onBeforeSnapToItem}
        inactiveSlideOpacity={0.3}
        inactiveSlideScale={0.5}
        enableSnap={true}
        swipeThreshold={0}
        activeSlideOffset={0}
        firstItem={parseInt(this.state.selected)}
        // useScrollView={true}
        initialNumToRender={numbers.length}
      />
      // <FlatList
      //   initialScrollIndex={this.state.selected}
      //   data={numbers}
      //   renderItem={this.renderItem}
      //   keyExtractor={item => 'k' + item}
      //   initialNumToRender={numbers.length > 60 ? 60 : numbers.length}
      //   // onScroll={this.onScroll}
      //   onViewableItemsChanged={this.onViewableItemsChanged}
      //   // pagingEnabled={true}
      // />
    );
  }
}

import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

import {inject, observer} from 'mobx-react';
import Carousel from 'react-native-snap-carousel';

import theme from '../../styles/appearance';

class CMSNumberPicker extends React.Component {
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

  renderItem = ({item}) => {
    const {appearance} = this.props.appStore;

    return (
      <TouchableOpacity style={styles.itemContainer}>
        <Text style={[styles.itemText, theme[appearance].text]}>
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
    __DEV__ &&
      console.log(
        'onViewableItemsChanged Changed in this iteration viewableItems',
        viewableItems
      );
    let mid = Math.floor(
      (viewableItems[0].index + viewableItems[viewableItems.length - 1].index) /
        2
    );
    this.setState({midIndex: mid});
  };

  onSnapToItem = index => {
    this.props.onSelectNumber(this.props.numbers[index], index);
  };

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
        initialNumToRender={numbers.length}
      />
    );
  }
}

const styles = StyleSheet.create({
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    height: 40,
  },
  itemText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default inject('appStore')(observer(CMSNumberPicker));

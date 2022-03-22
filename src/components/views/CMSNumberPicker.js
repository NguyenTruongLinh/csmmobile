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
        onPress={() => {
          this.props.onSelectNumber(item, index);
          this.setState({selected: item});
        }}
        style={{
          backgroundColor:
            item == this.state.selected
              ? CMSColors.DisableItemColor
              : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
        }}>
        <Text style={{color: CMSColors.PrimaryText, fontSize: 18}}>
          {item < 10 ? '0' + item : item}
        </Text>
      </TouchableOpacity>
    );
  };

  render() {
    const {numbers} = this.props;
    __DEV__ &&
      console.log(
        'onPress render this.state.selected',
        `this.state.selected=${this.state.selected}`
      );
    return (
      <FlatList
        initialScrollIndex={this.state.selected}
        data={numbers}
        renderItem={this.renderItem}
        keyExtractor={item => 'k' + item}
        initialNumToRender={numbers.length > 60 ? 60 : numbers.length}
      />
    );
  }
}

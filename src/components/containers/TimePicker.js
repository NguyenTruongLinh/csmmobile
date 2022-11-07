import React, {Component} from 'react';
import {Text, View, StyleSheet, FlatList} from 'react-native';
import Ripple from 'react-native-material-ripple';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import {inject, observer} from 'mobx-react';
import theme from '../../styles/appearance';

const LINE_HEIGHT = 40;
const hoursData = [...Array(24).keys()];

class TimePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected ? props.selected : 0,
    };
  }

  componentDidMount = () => {
    const {selected} = this.props;
    setTimeout(() => {
      if (selected)
        setTimeout(() => {
          this._scrollView &&
            this._scrollView.scrollToIndex({index: selected, animated: true});
        }, 100);
    }, 100);
  };

  formatNumber = n => {
    return n > 9 ? n : '0' + n;
  };

  onSelected = (item, index) => {
    __DEV__ && console.log('GOND TimePicker onSelected: ', item);
    this.setState({
      selected: item,
    });
    if (this._scrollView) {
      this._scrollView.scrollToIndex({
        index,
        animated: true,
      });
    }
    this.props.setParamTime && this.props.setParamTime(item); //(item.id);
  };

  renderRow = ({item, index}) => {
    if (util.isNullOrUndef(item)) return;
    const {appearance} = this.props.appStore;

    const isCheck = item == this.state.selected;
    if (isCheck) {
      setTimeout(() => {
        if (this._scrollView) {
          this._scrollView.scrollToIndex({
            index: this.state.selected,
            animated: true,
          });
        }
      }, 10);
    }

    return (
      <Ripple rippleOpacity={0.87} onPress={() => this.onSelected(item, index)}>
        <View style={[styles.rowList, theme[appearance].headerListRow]}>
          <View style={[styles.rowButton_contain_name]}>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.rowButton_name,
                  isCheck ? styles.rowButton_name_selected : null,
                  theme[appearance].text,
                ]}>
                {this.formatNumber(item)}
              </Text>
            </View>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.rowButton_name,
                  isCheck ? styles.rowButton_name_selected : null,
                  theme[appearance].text,
                ]}>
                {this.props.type == 'end' ? '59' : '00'}
              </Text>
            </View>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.rowButton_name,
                  isCheck ? styles.rowButton_name_selected : null,
                  theme[appearance].text,
                ]}>
                {this.props.type == 'end' ? '59' : '00'}
              </Text>
            </View>
          </View>
        </View>
      </Ripple>
    );
  };

  render() {
    const {appearance} = this.props.appStore;

    return (
      <View style={[styles.container, theme[appearance].headerListRow]}>
        <View style={[styles.rowButton_contain_title_time]}>
          <View style={styles.titleContainer}>
            <Text style={styles.title_time}>Hour</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title_time}>Minute</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title_time}>Second</Text>
          </View>
        </View>
        <FlatList
          style={{zIndex: 1}}
          ref={r => (this._scrollView = r)}
          data={hoursData}
          renderItem={this.renderRow}
          keyExtractor={item => 'h_' + item}
          getItemLayout={(data, index) => ({
            length: LINE_HEIGHT,
            offset: LINE_HEIGHT * (index - 1),
            index,
          })}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {flex: 1},
  rowList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.White,
    height: LINE_HEIGHT,
  },

  rowButton_contain_name: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowButton_contain_title_time: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    height: 35,
    padding: 5,
  },
  rowButton_name: {
    margin: 5,
    color: CMSColors.PrimaryText,
    fontSize: 15,
  },
  titleContainer: {flex: 1, alignItems: 'center'},
  title_time: {
    paddingTop: 5,
    paddingBottom: 5,
    color: CMSColors.SecondaryText,
    fontSize: 11,
  },
  rowButton_name_selected: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  containIconCheck: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
});

export default inject('appStore')(observer(TimePicker));

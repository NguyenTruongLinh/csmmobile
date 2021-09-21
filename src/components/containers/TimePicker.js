import React, {Component, PropTypes} from 'react';
import {Text, View, StyleSheet, ScrollView, FlatList} from 'react-native';
import Ripple from 'react-native-material-ripple';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';

export default class TimePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected ? props.selected : 0,
    };
  }

  componentDidMount = () => {
    setTimeout(() => {
      this.setState({
        dataSource: this.buildListData(),
      });
    }, 100);
  };

  componentDidUpdate(prevProp) {
    const {selected} = this.props;
    if (selected != this.state.selected) {
      this.setState({
        selected: selected,
        dataSource: this.buildListData(selected),
      });

      setTimeout(() => {
        let newY = parseInt(selected * 40 - 40);
        this._scrollView.scrollTo({y: newY, animated: true});
      }, 100);
    }
  }

  buildListData = selected => {
    let ds = [];

    let filter = util.isNullOrUndef(selected) ? this.state.selected : selected;

    for (let i = 0; i <= 23; i++) {
      let item = {
        id: i,
        isCheck: i == filter ? true : false,
      };
      ds.push(item);
    }

    return ds;
  };

  formatNumber = n => {
    return n > 9 ? n : '0' + n;
  };

  renderRow = ({item, index}) => {
    if (util.isNullOrUndef(item)) return;

    if (item.isCheck == true) {
      setTimeout(() => {
        if (this._scrollView) {
          let newY = parseInt(this.state.selected * 40 - 40);
          this._scrollView.scrollTo({y: newY, animated: true});
        }
      }, 10);
    }

    return (
      <Ripple
        rippleOpacity={0.87}
        onPress={() => {
          this.setState({
            selected: item.id,
            dataSource: this.buildListData(item.id),
          });
          if (this._scrollView) {
            let newY = parseInt(index * 40 - 40);
            this._scrollView.scrollTo({y: newY, animated: true});
          }
          this.props.setParamTime(item.id);
        }}>
        <View style={styles.rowList}>
          <View style={[styles.rowButton_contain_name]}>
            <View style={{flex: 1, alignItems: 'center'}}>
              <Text
                style={[
                  styles.rowButton_name,
                  item.isCheck == true ? styles.rowButton_name_selected : null,
                ]}>
                {this.formatNumber(item.id)}
              </Text>
            </View>
            <View style={{flex: 1, alignItems: 'center'}}>
              <Text
                style={[
                  styles.rowButton_name,
                  item.isCheck == true ? styles.rowButton_name_selected : null,
                ]}>
                {this.props.type == 'end' ? '59' : '00'}
              </Text>
            </View>
            <View style={{flex: 1, alignItems: 'center'}}>
              <Text
                style={[
                  styles.rowButton_name,
                  item.isCheck == true ? styles.rowButton_name_selected : null,
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
    return (
      <View style={{flex: 1}}>
        <View style={[styles.rowButton_contain_title_time]}>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Text style={[styles.title_time]}>Hour</Text>
          </View>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Text style={[styles.title_time]}>Minute</Text>
          </View>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Text style={[styles.title_time]}>Second</Text>
          </View>
        </View>
        <ScrollView
          style={{zIndex: 1}}
          ref={e => {
            this._scrollView = e;
          }}>
          <FlatList
            // contentContainerStyle={[
            //   styles_cmp.PullToRefreshListView_content,
            //   {backgroundColor: CMSColors.White},
            // ]}
            // style={[styles_cmp.PullToRefreshListView_Style]}
            data={this.state.dataSource}
            renderItem={this.renderRow}
            keyExtractor={item => item.id}
          />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  rowList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.White,
    height: 40,
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
    height: 30,
    padding: 5,
  },
  rowButton_name: {
    margin: 5,
    color: CMSColors.PrimaryText,
    fontSize: 15,
  },
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

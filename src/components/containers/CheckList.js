import React, {Component} from 'react';
import {Text, View, StyleSheet, FlatList} from 'react-native';
import Ripple from 'react-native-material-ripple';

import {inject, observer} from 'mobx-react';

import {Icon} from '../CMSStyleSheet';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';

class CheckList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected ? props.selected : [],
      dataSource: this.buildListData(props.selected ? props.selected : []),
    };
  }

  componentDidMount = () => {
    setTimeout(() => {
      this.setState({
        dataSource: this.buildListData(this.state.selected),
      });
    }, 100);
  };

  buildListData = selected => {
    const {data} = this.props;
    if (!data) return [];

    return data.map(x => ({
      ...x,
      isCheck: selected ? selected.includes(x.id) : false,
    }));
  };

  renderRow = ({item}) => {
    if (!item) return;
    const {style} = this.props;
    const {appearance} = this.props.appStore;

    return (
      <Ripple
        rippleOpacity={0.87}
        onPress={() => {
          const {selected} = this.state;
          if (selected.includes(item.id)) {
            let newSelected = selected.filter(e => e != item.id);
            this.props.onAddMoreParams(newSelected);
            this.setState({
              selected: newSelected,
              dataSource: this.buildListData(newSelected),
            });
          } else {
            let newSelected = [item.id, ...selected];
            this.props.onAddMoreParams(newSelected);
            this.setState({
              selected: newSelected,
              dataSource: this.buildListData(newSelected),
            });
          }
        }}>
        <View style={[styles.rowList, style]}>
          <View style={[styles.containIconCheck]}>
            {item.isCheck == true ? (
              <Icon
                name="check-square"
                color={CMSColors.PrimaryActive}
                size={22}
              />
            ) : (
              <Icon name="square-o" color={CMSColors.DividerColor} size={22} />
            )}
          </View>
          <View style={styles.rowButton_contain_name}>
            <Text style={[styles.rowButton_name, theme[appearance].text]}>
              {item.name}
            </Text>
          </View>
        </View>
      </Ripple>
    );
  };

  render() {
    return (
      <FlatList
        data={this.state.dataSource}
        renderItem={this.renderRow}
        keyExtractor={(item, index) => item.id ?? 'k_' + index}
      />
    );
  }
}

const styles = StyleSheet.create({
  rowList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    backgroundColor: CMSColors.White,
    minHeight: 40,
  },

  rowButton_contain_name: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rowButton_name: {
    margin: 5,
    color: CMSColors.PrimaryText,
    fontSize: 15,
  },
  containIconCheck: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
});

export default inject('appStore')(observer(CheckList));

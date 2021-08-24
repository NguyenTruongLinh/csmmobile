import React, {Component} from 'react';
import {Text, View, StyleSheet, FlatList} from 'react-native';
import Ripple from 'react-native-material-ripple';

import {Icon} from '../CMSStyleSheet';

import CMSColors from '../../styles/cmscolors';

export default class CheckList extends Component {
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
    return (
      <Ripple
        rippleOpacity={0.87}
        onPress={() => {
          const {selected} = this.state;
          // __DEV__ &&
          //   console.log(
          //     'GOND CheckList onSelected: ',
          //     item,
          //     ', current: ',
          //     selected
          //   );
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
        <View style={styles.rowList}>
          <View style={[styles.containIconCheck]}>
            {item.isCheck == true ? (
              <Icon
                name="check-square"
                color={CMSColors.PrimaryColor}
                size={22}
              />
            ) : (
              <Icon name="square" color={CMSColors.DividerColor} size={22} />
            )}
          </View>
          <View style={styles.rowButton_contain_name}>
            <Text style={styles.rowButton_name}>{item.name}</Text>
          </View>
        </View>
      </Ripple>
    );
  };

  render() {
    return (
      <FlatList
        // contentContainerStyle={[
        //   styles_cmp.PullToRefreshListView_content,
        //   {backgroundColor: CMSColors.White},
        // ]}
        // style={[styles_cmp.PullToRefreshListView_Style]}
        // enableEmptySections={true}
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
    //borderBottomWidth: 1,
    // borderColor: 'rgb(204, 204, 204)',
    backgroundColor: CMSColors.White,
    minHeight: 40,
  },

  rowButton_contain_name: {
    flex: 1,
    //backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rowButton_name: {
    margin: 5,
    //paddingTop: 2,
    //paddingBottom: 2,
    color: CMSColors.PrimaryText,
    fontSize: 15,
  },
  containIconCheck: {
    //backgroundColor: 'blue'
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
    //backgroundColor: '#D8D8D8',
  },
});

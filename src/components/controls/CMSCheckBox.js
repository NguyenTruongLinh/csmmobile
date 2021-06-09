import React, {Component, PropTypes} from 'react';
import {Text, View, StyleSheet, ScrollView} from 'react-native';

import SearchBar from 'react-native-searchbar';
import Ripple from 'react-native-material-ripple';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';

import {compareStrings} from '../../util/general';

import {Icon, IconCustom} from '../CMSStyleSheet';
import CMSColors from '../../styles/cmscolors';

export default class CheckboxGroup extends Component {
  static defaultProps = {
    enableSearch: true,
    enableSort: true,
    showSelectAll: true,
    showItemIcon: true,
  };

  constructor(props) {
    super(props);
    // __DEV__ && console.log('GOND allData = ', props.allData);
    this._onSelectAll.bind(this);
  }

  componentDidMount = () => {
    // __DEV__ && console.log('GOND allData = ', this.props.allData);
    if (!this.props.allData) return;

    this.props.allData.map(checkbox => {
      if (checkbox.selected) {
        this._onSelect(checkbox.value);
      }
    });
  };

  getNewDimensions(event) {
    const pageHeight = event.nativeEvent.layout.height;
    const pageWidth = event.nativeEvent.layout.width;
    this.setState({
      pageHeight,
      pageWidth,
    });
  }

  _onSelect = item => {
    const {selected} = this.props;
    let result = selected.includes(item)
      ? selected.filter(i => i != item)
      : [...selected, item];
    this.props.callback(result);
  };

  _onSelectAll = value => {
    let selected = [];
    if (value == true) {
      let prop_name = this.props.keyname ? this.props.keyname : 'value';
      selected = this.props.allData.map(item => item[prop_name]);
    }

    if (this.props.callback) this.props.callback(selected);
  };

  _checkSelectAll = () => {
    let alldata = this.props.allData;
    if (!alldata || alldata.length == 0) {
      return false;
    }
    if (!this.props.selected) {
      return false;
    }
    if (alldata.length == this.props.selected.length) {
      return true;
    }

    return false;
  };

  _handleSearch = input => {
    if (this._checkSelectAll() == true) {
      this._onSelectAll(false);
    }
    //let checkboxes  = this.props.checkboxes;
    let checkboxes = this.props.dataForSearch; //this.state.allData;
    if (!checkboxes || checkboxes.length == 0) return;

    // let can_search = !input || input.length == 0 ? true : false;
    //this.setState({ can_refresh: can_search});
    //let alt_type = this.props.Data;

    let result = checkboxes.filter(val => {
      let str = this.getLabel(val).toLowerCase();
      let search = input.toLowerCase();
      let ret = !str ? false : str.includes(search);

      return ret;
    });
    this.props.setFilterDataSource(result);
  };

  compareFn = (a, b) => {
    return a > b ? 1 : a < b ? -1 : 0;
  };

  sortItems(data, isSortAZ) {
    let res = [...data];
    if (!this.props.enableSort) return res;

    // if (isSortAZ == true) {
    //   return _.sortBy(data, [
    //     o => {
    //       return this.getLabelSort(o);
    //     },
    //   ]);
    // }

    // return _.sortBy(data, [
    //   o => {
    //     return this.getLabelSort(o);
    //   },
    // ]).reverse();

    res.sort(
      (a, b) =>
        isSortAZ
          ? compareStrings(this.getLabelSort(a), this.getLabelSort(b)) // this.getLabelSort(a) > this.getLabelSort(b)
          : compareStrings(this.getLabelSort(b), this.getLabelSort(a)) // this.getLabelSort(a) < this.getLabelSort(b)
    );
    // __DEV__ &&  console.log('GOND sortItems after: ', res);
    return res;
  }

  getValue = item => {
    if (!item) return item;
    if (this.props.keyname) return item[this.props.keyname];

    return item.value;
  };

  getLabel = item => {
    if (!item) return item;

    if (this.props.textname) return item[this.props.textname];

    return item.label;
  };

  getLabelSort = item => {
    if (!item) return item;

    if (this.props.textname)
      return item[this.props.textname]
        ? item[this.props.textname].toLowerCase()
        : item[this.props.textname];

    return item.label;
  };

  render() {
    const {
      iconSize,
      labelStyle,
      checkedIcon,
      avatarIcon,
      uncheckedIcon,
      rowStyle,
      rowDirection,
      enableSearch,
    } = this.props;

    let iconCheck = (
      <View style={styles.containIconCheck}>
        <Icon
          name={checkedIcon}
          color={CMSColors.PrimaryColor}
          size={iconSize}
        />
      </View>
    );

    let iconAvatar = avatarIcon ? (
      <View style={styles.containIcon}>
        <IconCustom name={avatarIcon} disabled={true} size={24} />
      </View>
    ) : null;

    let iconUnCheck = (
      <View style={styles.containIconCheck}>
        <Icon
          name={uncheckedIcon}
          color={CMSColors.DividerColor}
          size={iconSize}
        />
      </View>
    );

    const header = (
      <View style={styles.body_header}>
        <SearchBar
          enable={true}
          ref={ref => (this.searchBar = ref)}
          data={this.props.checkboxes}
          focusOnLayout={false}
          placeholder="Search..."
          handleSearch={input => {
            this._handleSearch(input);
          }}
          hideBack={true}
          showOnLoad={true}
        />
      </View>
    );

    let itemAll = (
      <Ripple
        key={0}
        style={[rowStyle, styles.rowStyleDefault]}
        onPress={() => {
          this._onSelectAll(!this._checkSelectAll());
        }}>
        {iconAvatar}
        <Text style={[labelStyle, styles.labeldefault]}>All</Text>
        {this._checkSelectAll() ? iconCheck : iconUnCheck}
      </Ripple>
    );

    let dataSort = this.sortItems(this.props.allData, this.props.isSortAZ);
    //  __DEV__ && console.log('GOND CMSCheckbox data = ', dataSort);
    return (
      <View
        onLayout={evt => {
          this.getNewDimensions(evt);
        }}
        style={{
          flex: 1,
          flexDirection: rowDirection,
          padding: 5,
        }}>
        {enableSearch ? header : null}
        <KeyboardAwareScrollView scrollToEnd={true} enableOnAndroid={true}>
          <ScrollView style={styles.content}>
            {this.props.showSelectAll && itemAll}
            {dataSort.map((checkbox, index) => {
              return (
                <Ripple
                  key={index}
                  style={[rowStyle, styles.rowStyleDefault]}
                  onPress={() => {
                    this._onSelect(this.getValue(checkbox));
                  }}>
                  {this.props.showItemIcon && (
                    <View style={styles.containIcon}>
                      <View style={[styles.flagCount]}>
                        <Text style={styles.flagCount_Text}>
                          {checkbox.typeWeight}
                        </Text>
                      </View>
                      <IconCustom
                        name="ic_flag_black_48px"
                        color={checkbox.color}
                        disabled={true}
                        size={24}
                      />
                    </View>
                  )}
                  <Text style={[labelStyle, styles.labeldefault]}>
                    {this.getLabel(checkbox)}
                  </Text>
                  <View>
                    {this.props.selected.includes(this.getValue(checkbox))
                      ? iconCheck
                      : iconUnCheck}
                  </View>
                </Ripple>
              );
            })}
          </ScrollView>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  body_header: {
    shadowColor: '#CDCDCD',
    shadowOpacity: 0.8,
    shadowOffset: {
      height: 2,
      width: 2,
    },
    borderWidth: 1,
    borderColor: 'rgb(204, 204, 204)',
    backgroundColor: CMSColors.White,
    // flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // height: 48,
    borderWidth: 2,
    borderColor: 'black',
    height: 60, // to prevent scrollview overlap header and weird behavior with parent's header
  },

  content: {
    flex: 1,
    paddingTop: 25,
  },

  labeldefault: {
    alignSelf: 'center',
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  searchbar: {
    borderWidth: 1,
    borderColor: 'rgb(204, 204, 204)',
    marginBottom: 10,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  containIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CMSColors.transparent,
  },

  rowStyleDefault: {
    height: 48,
    borderBottomWidth: 0.5,
    borderColor: 'rgb(204, 204, 204)',
    paddingTop: 5,
  },

  containIconCheck: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'flex-end',
  },

  rowButton_contain_name: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  flagCount: {
    backgroundColor: CMSColors.Danger,
    width: 15,
    height: 15,
    borderRadius: 8,
    position: 'absolute',
    zIndex: 2,
    right: 0,
    top: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  flagCount_Text: {
    color: '#fff',
    fontSize: 10,
  },
});

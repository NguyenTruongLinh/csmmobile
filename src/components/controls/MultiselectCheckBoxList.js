import React, {Component} from 'react';
import {
  Text,
  View,
  Dimensions,
  TouchableHighlight,
  StyleSheet,
  Platform,
} from 'react-native';

import Ripple from 'react-native-material-ripple';
import Accordion from 'react-native-collapsible/Accordion';
import {inject, observer} from 'mobx-react';

import {ConditionFilterException} from '../../consts/misc';
import CheckboxGroup from './CMSCheckBox';
import Button from './Button';

import {Icon, IconCustom} from '../CMSStyleSheet';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';

const session_header_height = 78;
class MultiselectCheckBoxList extends Component {
  static defaultProps = {
    titleText: 'POS Exception settings',
    itemName: 'Exception',
    showTitleIcon: true,
    titleIconName: 'ic_flag_black_48px',
    showItemIcon: true,
    enableAllSelection: true,
    enableSearch: true,
    enableSort: true,
    showSelectAll: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      data: this.props.data,
      contentheight: this.props.initheight,
      isSortAZ: true,
    };
    this.renderSelection.bind(this);
    // this.sortData.bind(this);
  }

  componentDidMount() {
    if (this.props.rotatable) {
      Dimensions.addEventListener('change', this.onDimensionChange);
    }
  }

  componentWillUnmount() {
    if (this.props.rotatable) {
      Dimensions.removeEventListener('change', this.onDimensionChange);
    }
  }

  _renderHeader(section, index, isActive) {
    const {appearance} = this.props.appStore;
    if (!section) {
      return;
    }
    switch (section.type) {
      case ConditionFilterException.EXCEPTION:
        return (
          <View key={section.type} style={styles.RowHeader}>
            <View style={styles.contentText}>
              <Text style={[styles.RowHeaderText, theme[appearance].text]}>
                {this.props.titleText}
              </Text>
            </View>
            {/* </Ripple> */}
          </View>
        );
      default:
        return <View />;
    }
  }

  renderSelection() {
    const {appearance} = this.props.appStore;
    let isNoneSelected =
      !this.props.selectedItems || this.props.selectedItems.length == 0
        ? true
        : false;
    return (
      <View style={[styles.containSites, {height: this.state.contentheight}]}>
        <View
          style={[
            styles.headerSites,
            theme[appearance].posExceptionModalSubHeader,
          ]}>
          <Text
            style={[
              styles.countsite_text,
              theme[appearance].text,
              isNoneSelected == true ? styles.countsite_text_empty : null,
            ]}>
            {this.props.selectedItems.length + ' selected'}
          </Text>
          <View>
            {this.props.enableSort ? (
              <Ripple
                style={styles.button_sort}
                onPress={() => {
                  this.setState({isSortAZ: !this.state.isSortAZ});
                }}>
                <Icon
                  name={
                    this.state.isSortAZ == true
                      ? 'sort-alpha-asc'
                      : 'sort-alpha-desc'
                  }
                  color={theme[appearance].iconColor}
                  size={17}
                />
              </Ripple>
            ) : null}
          </View>
        </View>
        <CheckboxGroup
          ref={element => {
            this.cbSite = element;
          }}
          callback={selected => {
            if (this.props.onSelectionChanged) {
              this.props.onSelectionChanged(selected);
            }
          }}
          setFilterDataSource={datafilter => {
            this.setState({data: datafilter});
          }}
          selected={this.props.selectedItems}
          iconSize={24}
          checkedIcon="check-square"
          avatarIcon={
            this.props.showItemIcon ? this.props.titleIconName : undefined
          }
          showItemIcon={this.props.showItemIcon}
          uncheckedIcon="square-o"
          keyname={this.props.itemId}
          textname={this.props.itemName}
          allData={this.state.data}
          dataForSearch={this.props.data}
          enableSort={this.props.enableSort}
          isSortAZ={this.state.isSortAZ}
          labelStyle={{
            color: theme[appearance].text.color,
          }}
          rowStyle={{
            flexDirection: 'row',
          }}
          rowDirection={'column'}
          enableSearch={this.props.enableSearch}
          showSelectAll={this.props.showSelectAll}
        />
      </View>
    );
  }

  _renderContent(section, index, isActive) {
    if (!isActive) {
      return;
    }
    if (!section.content) {
      return;
    }

    switch (section.type) {
      case ConditionFilterException.EXCEPTION:
        return this.renderSelection();
      default:
        return <View key={section.type} />;
    }
  }

  onDimensionChange = event => {
    const {width, height} = event.window;
    if (height < width) {
      let init_height = Math.min(this.props.initheight, this.props.initwidth);
      this.setState({contentheight: init_height});
    } else {
      let init_height = Math.max(this.props.initheight, this.props.initwidth);
      this.setState({contentheight: init_height});
    }
  };

  render() {
    let SECTIONS = [
      {
        type: ConditionFilterException.EXCEPTION,
        title: '8 Exceptions selected',
        content: ['a', 'b', 'c'],
      },
    ];

    return (
      <View onLayout={this.onLayout}>
        <Accordion
          key="1"
          // initiallyActiveSection={0}
          activeSections={[0]}
          sections={SECTIONS}
          renderHeader={this._renderHeader.bind(this)}
          renderContent={this._renderContent.bind(this)}
          onChange={() => {}}
          touchableComponent={props => <TouchableHighlight {...props} />}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  RowHeader: {
    height: session_header_height,
    backgroundColor: CMSColors.RowHeaderAccordion,
    justifyContent: 'center',
    alignItems: 'center',
  },
  RowHeaderText: {
    fontSize: 20,
    color: CMSColors.PrimaryText,
    fontWeight: 'bold',
  },
  event: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  icon_flag: {
    margin: 5,
    backgroundColor: CMSColors.Transparent,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },

  contentText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  containSites: {
    // borderColor: 'red',
    // borderWidth: 1,
  },

  headerSites: {
    backgroundColor: CMSColors.FilterRowBg,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  button_sort: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  countsite_text: {
    color: CMSColors.PrimaryText,
    fontSize: 16,
    marginLeft: 10,
  },

  countsite_text_empty: {
    color: CMSColors.ErrorColor,
  },
});

export default inject('appStore')(observer(MultiselectCheckBoxList));

import React from 'react';
import {View, Text, StyleSheet, Dimensions, Animated} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import CMSTouchableIcon from './CMSTouchableIcon';
import InputTextIcon from '../controls/InputTextIcon';

import CMSColors from '../../styles/cmscolors';

import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';
import {Comps as CompTxt} from '../../localization/texts';

const SEARCHBAR_HEIGHT = 52;

class CMSSearchbar extends React.Component {
  static propTypes = {
    value: PropTypes.string,
    onFilter: PropTypes.func,
    animation: PropTypes.bool,
    applyOnEnter: PropTypes.bool,
  };

  static defaultProps = {
    value: '',
    onFilter: () => console.log('GOND CMSSearchbar: onFilter not defined yet!'),
    animation: true,
    applyOnEnter: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      showSearchbar: false,
      searchViewHeight: new Animated.Value(0),
      searchbarPosition: new Animated.Value(-SEARCHBAR_HEIGHT),
      internalText: props.value,
    };

    this._isMounted = false;
    this.inputRef = null;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getSearchButton = callback => {
    const {appearance} = this.props.appStore;
    return (
      <CMSTouchableIcon
        size={24}
        onPress={() => this.onShowSearchbar(callback)}
        color={
          this.state.showSearchbar
            ? CMSColors.PrimaryActive
            : theme[appearance].iconColor
        }
        styles={commonStyles.headerIcon}
        iconCustom="searching-magnifying-glass"
      />
    );
  };

  onShowSearchbar = callback => {
    this.setState({showSearchbar: !this.state.showSearchbar}, () => {
      if (this.state.showSearchbar && this.inputRef) {
        this.inputRef.focus();
      }

      this.props.animation &&
        Animated.parallel([
          Animated.timing(this.state.searchbarPosition, {
            toValue: this.state.showSearchbar ? 0 : -SEARCHBAR_HEIGHT, // : 0,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(this.state.searchViewHeight, {
            toValue: this.state.showSearchbar ? SEARCHBAR_HEIGHT : 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ]).start();

      if (callback && typeof callback == 'function') {
        callback();
      }
    });
  };

  onChangeText = value => {
    const {onFilter, applyOnEnter} = this.props;
    this.setState({internalText: value});
    if (!applyOnEnter) {
      onFilter(value);
    }

    // if (applyOnEnter) {
    //   this.setState({internalText: value});
    // } else {
    //   onFilter(value);
    // }
  };

  onEnter = event => {
    const {onFilter, applyOnEnter} = this.props;
    const {internalText} = this.state;
    if (applyOnEnter) {
      onFilter(internalText);
    }
  };

  render() {
    const {onFilter, value, animation, applyOnEnter, appStore} = this.props;
    const {searchViewHeight, searchbarPosition, showSearchbar, internalText} =
      this.state;
    const {appearance} = appStore;

    return animation || showSearchbar ? (
      <Animated.View
        style={[
          commonStyles.flatSearchBarContainer,
          animation ? {height: searchViewHeight, top: searchbarPosition} : {},
          theme[appearance].container,
        ]}>
        <InputTextIcon
          ref={r => (this.inputRef = r)}
          label=""
          value={applyOnEnter ? internalText : value}
          onChangeText={this.onChangeText}
          onEndEditing={this.onEnter}
          placeholder={CompTxt.searchPlaceholder}
          iconCustom="searching-magnifying-glass"
          disabled={false}
          iconPosition="right"
          iconStyle={{
            position: 'absolute',
            right: -10,
            top: 5,
          }}
          iconColor={theme[appearance].iconColor}
          // fixAndroidBottomLine={true}
          fixAndroidBottomLineBottom={11}
        />
      </Animated.View>
    ) : null;
  }
}

const styles = StyleSheet.create({});

export default inject('appStore')(observer(CMSSearchbar));

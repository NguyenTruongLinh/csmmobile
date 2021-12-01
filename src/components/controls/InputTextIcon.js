import React, {PureComponent} from 'react';
import {View, Animated, Easing, StyleSheet, Platform} from 'react-native';
import {TextField} from 'react-native-material-textfield';
import Helper from 'react-native-material-textfield/src/components/helper';
import Counter from 'react-native-material-textfield/src/components/counter';
import PropTypes from 'prop-types';
import variable from '../../styles/variables';

import CMSColors from '../../styles/cmscolors';
import CMSStyleSheet from '../CMSStyleSheet';

const Icon = CMSStyleSheet.Icon;
const IconCustom = CMSStyleSheet.IconCustom;
const LABEL_FONT_SIZE = 13;

export default class InputTextIcon extends PureComponent {
  static defaultProps = {
    underlineColorAndroid: 'transparent',
    disableFullscreenUI: true,
    autoCapitalize: 'none',
    blurOnSubmit: true,
    editable: true,

    animationDuration: 225,

    //fontSize: CMSStyleSheet.FontSize,
    fontSize: variable.fix_fontSire,

    tintColor: CMSColors.BorderActiveColor,
    textColor: CMSColors.ActionText,
    baseColor: CMSColors.BorderColor,

    errorColor: CMSColors.ErrorColor,

    disabled: false,
    iconPosition: 'left',
    revealable: false,
    placeholder: '',
    noBorder: false,
  };

  static propTypes = {
    ...TextField.propTypes,
    name: PropTypes.string,
    animationDuration: PropTypes.number,

    fontSize: PropTypes.number,

    tintColor: PropTypes.string,
    textColor: PropTypes.string,
    baseColor: PropTypes.string,

    icon: PropTypes.string,
    iconCustom: PropTypes.string,
    label: PropTypes.string.isRequired,
    title: PropTypes.string,

    characterRestriction: PropTypes.number,

    error: PropTypes.string,
    errorColor: PropTypes.string,

    disabled: PropTypes.bool,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    revealable: PropTypes.bool,
    placeholder: PropTypes.string,
  };

  constructor(props) {
    super(props);

    let {value, error} = this.props;

    this.mounted = false;
    this.state = {
      text: value,

      focus: new Animated.Value(error ? -1 : 0),
      focused: false,

      error: error,
      errored: !!error,

      height: 24,
      revealHidden: false,
    };
    this.inputRef = null;
  }

  UNSAFE_componentWillReceiveProps(props) {
    let {text, error} = this.state;

    if (null != props.value && props.value !== text) {
      this.setState({text: props.value});
    }

    if (props.error && props.error !== error) {
      this.setState({error: props.error});
    }

    if (props.error !== this.props.error) {
      this.setState({errored: !!props.error});
    }
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  UNSAFE_componentWillUpdate(props, state) {
    let {error, animationDuration} = this.props;
    let {focus, focused} = this.state;

    if (props.error !== error || focused ^ state.focused) {
      Animated.timing(focus, {
        toValue: props.error ? -1 : state.focused ? 1 : 0,
        duration: animationDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        if (this.mounted) {
          this.setState((state, {error}) => ({error}));
        }
      });
    }
  }

  focus = () => {
    let {disabled, editable} = this.props;

    if (!disabled && editable && !this.inputRef.isFocused()) {
      this.inputRef.focus();
    }
  };

  blur = () => {
    this.inputRef.blur();
  };

  clear = () => {
    this.inputRef.clear();
  };

  value = () => {
    return this.state.text;
  };

  isFocused = () => {
    return this.inputRef.isFocused();
  };

  isRestricted = () => {
    let {characterRestriction} = this.props;
    let {text = ''} = this.state;

    return characterRestriction < text.length;
  };

  onFocus = event => {
    let {onFocus} = this.props;

    if (typeof onFocus === 'function') {
      onFocus(event);
    }

    this.setState({focused: true});
  };

  onBlur = event => {
    let {onBlur} = this.props;

    if (typeof onBlur === 'function') {
      onBlur(event, this.props.name);
    }

    this.setState({focused: false});
  };

  onChangeText = text => {
    let {onChangeText} = this.props;

    if (typeof onChangeText === 'function') {
      onChangeText(text, this.props.name);
    }

    this.setState({text});
  };

  onEndEditing = e => {
    let {onEndEditing} = this.props;

    if (typeof onEndEditing === 'function') {
      onEndEditing(e, this.props.name);
    }
  };

  onContentSizeChange = ({nativeEvent}) => {
    let {height} = nativeEvent.contentSize;

    this.setState({height: Math.ceil(height)});
  };

  render() {
    let {
      style,
      icon,
      iconCustom,
      label,
      maxLength,
      title,
      characterRestriction: limit,
      editable,
      disabled,
      animationDuration,
      fontSize,
      tintColor,
      baseColor,
      textColor,
      iconColor,
      errorColor,
      secureTextEntry,
      revealable,
      iconPosition,
      placeholder,
      noBorder,
      ...props
    } = this.props;
    let {focused, focus, error, errored, height, text = ''} = this.state;
    let {multiline} = props;

    let count = text.length;
    let active = !!text;
    let restricted = limit < count;

    let inputStyle = {
      fontSize,

      color: disabled ? baseColor : textColor,

      ...(multiline
        ? {
            height: fontSize * 1.5 + height,

            ...Platform.select({
              ios: {left: 1, top: -1},
              android: {textAlignVertical: 'top'},
            }),
          }
        : {height: fontSize * 1.8}),
    };

    let errorStyle = {
      color: errorColor,

      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [1, 0, 0],
      }),

      fontSize: title
        ? fontSize
        : focus.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [12, 0, 0],
          }),
    };

    let titleStyle = {
      color: baseColor,

      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 1],
      }),

      fontSize: fontSize,
    };

    let helperContainerStyle = {
      flexDirection: 'row',
      height:
        title || limit
          ? 24
          : focus.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [24, 8, 8],
            }),
    };

    let CIcon = icon ? (
      <Icon
        name={icon}
        size={variable.fix_fontSize_Icon}
        style={[
          {color: iconColor || baseColor},
          styles.icon,
          label ? {} : {paddingTop: 28},
        ]}
        // onPress={() =>  __DEV__ && console.log('GOND icon name: ', icon)}
      />
    ) : null;
    let CIconCustom = iconCustom ? (
      <IconCustom
        name={iconCustom}
        size={variable.fix_fontSize_Icon}
        style={[
          {color: iconColor || baseColor},
          styles.icon,
          label ? {} : {paddingTop: 28},
        ]}
        // onPress={() =>  __DEV__ && console.log('GOND icon customed name: ', iconCustom)}
      />
    ) : null;
    const showFishEye =
      secureTextEntry && revealable && iconPosition != 'right';
    const revealIconStyle = this.state.revealHidden
      ? {}
      : {color: CMSColors.PrimaryActive};
    return (
      <View
        style={{
          marginTop: -20,
          flexDirection: 'row',
          alignSelf: 'center',
          borderColor: 'transparent',
          borderWidth: 1,
        }}>
        {iconPosition == 'left' && CIcon}
        {iconPosition == 'left' && CIconCustom}
        <View
          onStartShouldSetResponder={() => true}
          onResponderRelease={this.focus}
          style={styles.flex}>
          <TextField
            style={[
              styles.input,
              inputStyle,
              style,
              showFishEye ? {paddingRight: 40} : {},
            ]}
            selectionColor={noBorder ? CMSColors.Transparent : tintColor}
            tintColor={noBorder ? CMSColors.Transparent : tintColor}
            baseColor={noBorder ? CMSColors.Transparent : baseColor}
            {...props}
            {...{
              // tintColor,
              // baseColor,
              errorColor,
              animationDuration,
              focused,
              errored,
              restricted,
              active,
            }}
            maxLength={maxLength}
            editable={!disabled && editable}
            onEndEditing={this.onEndEditing}
            onChangeText={this.onChangeText}
            onContentSizeChange={this.onContentSizeChange}
            onFocus={event => {
              this.onFocus(event);
            }}
            onBlur={this.onBlur}
            value={text}
            placeholder={placeholder}
            placeholderTextColor={baseColor}
            ref={ref => (this.inputRef = ref)}
            label={label}
            labelFontSize={label ? LABEL_FONT_SIZE : 0}
            secureTextEntry={secureTextEntry && !this.state.revealHidden}
            containerStyle={styles.textFieldContainerStyle}
            inputContainerStyle={styles.textFieldInputContainerStyle}
          />
          <Animated.View style={helperContainerStyle}>
            <View style={styles.flex}>
              <Helper
                style={errorStyle}
                text={error}
                focusAnimation={new Animated.Value(0)}
              />
              <Helper
                style={titleStyle}
                text={title}
                focusAnimation={new Animated.Value(0)}
              />
            </View>
            <Counter {...{baseColor, errorColor, count, limit}} />
          </Animated.View>
        </View>
        {showFishEye ? (
          <IconCustom
            name={
              this.state.revealHidden
                ? 'ic_remove_red_eye_24px'
                : 'turn-visibility-off-button'
            }
            size={variable.fix_fontSize_Icon}
            style={[{color: iconColor || baseColor}, styles.rightIcon]}
            onPress={() => {
              //  __DEV__ && console.log('GOND icon customed name: ', iconCustom);
              this.setState({revealHidden: !this.state.revealHidden});
            }}
          />
        ) : null}
        {iconPosition == 'right' && CIcon}
        {iconPosition == 'right' && CIconCustom}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  icon: {
    paddingTop: 42,
    paddingRight: 12,
    backgroundColor: 'transparent',
  },
  rightIcon: {
    height: 40,
    width: 40,
    position: 'absolute',
    right: 0,
    bottom: 10,
    padding: 10,
    backgroundColor: 'white',
  },
  input: {
    top: 2,
    height: 24,
    fontSize: variable.fix_fontSire,
    // padding: 0,
    // margin: 0,
    textAlignVertical: 'center',
  },
  flex: {
    flex: 1,
  },
  textFieldContainerStyle: {
    height: 75,
  },
  textFieldInputContainerStyle: {
    marginTop: 10,
  },
});

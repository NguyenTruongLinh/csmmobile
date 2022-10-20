import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {View, Animated, Easing, StyleSheet, Platform} from 'react-native';

import {TextField} from 'react-native-material-textfield';
import Helper from 'react-native-material-textfield/src/components/helper';
import Counter from 'react-native-material-textfield/src/components/counter';
import validate from 'validate.js';
import {inject, observer} from 'mobx-react';

import CMSColors from '../../styles/cmscolors';
import CMSStyleSheet from '../CMSStyleSheet';
import theme from '../../styles/appearance';

class InputText extends PureComponent {
  static defaultProps = {
    underlineColorAndroid: 'transparent',
    disableFullscreenUI: true,
    autoCapitalize: 'sentences',
    blurOnSubmit: true,
    editable: true,

    validation: null,
    animationDuration: 225,

    fontSize: CMSStyleSheet.FontSize,

    tintColor: CMSColors.BorderActiveColor,

    errorColor: CMSColors.ErrorColor,

    disabled: false,
  };

  static propTypes = {
    ...TextField.propTypes,

    validation: PropTypes.object,
    animationDuration: PropTypes.number,

    fontSize: PropTypes.number,

    tintColor: PropTypes.string,
    textColor: PropTypes.string,
    baseColor: PropTypes.string,

    label: PropTypes.string.isRequired,
    title: PropTypes.string,

    characterRestriction: PropTypes.number,

    error: PropTypes.string,
    errorColor: PropTypes.string,

    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onPress = this.focus.bind(this);
    this.onChangeText = this.onChangeText.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.onValidate = this.onValidate.bind(this);
    this.isValid = this.isValid.bind(this);

    let {value, error} = this.props;

    this._isMounted = false;
    this.state = {
      text: value,

      focus: new Animated.Value(error ? -1 : 0),
      focused: false,

      error: error,
      // errored: !!error,
      validationError: '',

      height: 24,
    };
  }

  // UNSAFE_componentWillReceiveProps(props) {
  //   let {text, error} = this.state;

  //   if (null != props.value && props.value !== text) {
  //     this.setState({text: props.value});
  //   }

  //   if (props.error && props.error !== error) {
  //     this.setState({error: props.error});
  //   }

  //   if (props.error !== this.props.error) {
  //     this.setState({errored: !!props.error});
  //   }
  // }

  static getDerivedStateFromProps(nextProps, prevState) {
    let {text, error} = prevState;
    let nextState = {};

    if (nextProps.value != null && nextProps.value !== text) {
      nextState = {...nextState, text: nextProps.value};
    }

    if (nextProps.error && nextProps.error !== error) {
      nextState = {...nextState, error: nextProps.error};
    }

    // if (nextProps.error !== this.props.error) {
    //   this.setState({errored: !!props.error});
    // }
    return nextState;
  }

  // UNSAFE_componentWillUpdate(props, state) {
  //   let {error, animationDuration} = this.props;
  //   let {focus, focused} = this.state;

  //   if (props.error !== error || focused ^ state.focused) {
  //     Animated.timing(focus, {
  //       toValue: props.error ? -1 : state.focused ? 1 : 0,
  //       duration: animationDuration,
  //       easing: Easing.inOut(Easing.ease),
  //       useNativeDriver: false,
  //     }).start(() => {
  //       if (this._isMounted) {
  //         this.setState((state, {error}) => ({error}));
  //       }
  //     });
  //   }
  // }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  focus = () => {
    let {disabled, editable} = this.props;

    if (!disabled && editable) {
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

  onFocus(event) {
    // __DEV__ && console.log('GOND InputText onFocus: ', event);
    let {onFocus, validation} = this.props;
    let {error} = this.state;

    if (typeof onFocus === 'function') {
      onFocus(event);
    }

    this.setState({focused: true, error: validation ? null : error});
  }

  onBlur() {
    let {onBlur} = this.props;
    let {error, text} = this.state;
    // __DEV__ && console.log('GOND InputText onBlur: ', text);

    if (typeof onBlur === 'function') {
      onBlur();
    }

    error = this.onValidate(text) || error;
    // __DEV__ && console.log('GOND InputText onBlur valid: ', error);
    this.setState({focused: false, error: error});
  }

  onChangeText(text) {
    // __DEV__ && console.log('GOND InputText onChangeText: ', text);
    let {onChangeText} = this.props;
    let {error} = this.state;

    if (typeof onChangeText === 'function') {
      onChangeText(text);
    }

    error = this.onValidate(text);
    this.setState({text, error});
  }

  onValidate(value) {
    let {validation} = this.props;
    let {error} = this.state;

    if (!validation) {
      // __DEV__ && console.log('GOND InputText no validation');
      return error;
    }
    const name = Object.keys(validation)[0];

    let formValues = {};
    formValues[name] = value;
    let formFields = {};
    formFields[name] = validation[name];

    const result = validate(formValues, formFields);
    // If there is an error message, return it!
    if (result) {
      // Return only the field error message if there are multiple
      // __DEV__ && console.log('GOND InputText validate = ', result);
      return result[name][0];
    }

    // __DEV__ && console.log('GOND InputText validate is valid');
    return null;
  }

  isValid() {
    return this.props.validation ? !this.state.error : true;
  }

  onContentSizeChange = ({nativeEvent}) => {
    let {height} = nativeEvent.contentSize;

    this.setState({height: Math.ceil(height)});
  };

  render() {
    let {
      style,
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
      errorColor,
      validation,
      ...props
    } = this.props;
    let {focused, focus, error, /*errored,*/ height, text = ''} = this.state;
    let {multiline, numberOfLines} = props;
    const {appearance} = this.props.appStore;
    // __DEV__ && console.log('GOND InputText rerender error: ', error);

    const overrideBaseColor = baseColor
      ? baseColor
      : theme[appearance].baseColor;

    let count = !text ? 0 : text.length;
    let active = !!text;
    let restricted = limit < count;

    let borderBottomColor = restricted
      ? errorColor
      : focus.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [errorColor, overrideBaseColor, tintColor],
        });

    let borderBottomWidth = restricted
      ? 2
      : focus.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [2, StyleSheet.hairlineWidth, 2],
        });

    let containerStyle = {
      ...(disabled
        ? {overflow: 'hidden'}
        : {borderBottomColor, borderBottomWidth}),

      ...(multiline ? {height: 40 + height} : {height: 40 + fontSize * 1.5}),
    };

    let inputStyle = {
      fontSize,

      color: disabled ? overrideBaseColor : theme[appearance].text.color,

      ...(multiline
        ? {
            height: fontSize * 1.5 + height,

            ...Platform.select({
              ios: {left: 1, top: -1},
              android: {textAlignVertical: 'top'},
            }),
          }
        : {height: fontSize * 1.5}),
    };

    let errorStyle = {
      color: errorColor,

      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [1, 0, 0],
      }),

      fontSize: title
        ? 12
        : focus.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [12, 0, 0],
          }),
    };

    let titleStyle = {
      color: overrideBaseColor,

      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 1],
      }),

      fontSize: 12,
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

    return (
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={this.focus}>
        {/* <Animated.View style={[ styles.container, containerStyle ]}> */}
        {/* {disabled && <Line type='dotted' color={baseColor} focusAnimation={new Animated.Value(0)} />} */}
        {/* <Label activeFontSize={fontSize} active={true} > */}
        {/* {...{ fontSize, tintColor, baseColor, errorColor, animationDuration, focused, errored, restricted, active }}> */}
        {/* {label} */}
        {/* </Label> */}
        <TextField
          style={[styles.input, inputStyle, style]}
          selectionColor={tintColor}
          maxLength={maxLength}
          {...props}
          {...{
            fontSize,
            tintColor,
            baseColor,
            errorColor,
            animationDuration,
            focused,
            // errored,
            restricted,
            active,
          }}
          error={validation ? error : props.error}
          label={label}
          labelFontSize={fontSize}
          baseColor={overrideBaseColor}
          editable={!disabled && editable}
          onChangeText={this.onChangeText}
          onContentSizeChange={this.onContentSizeChange}
          onFocus={event => this.onFocus(event)}
          onBlur={this.onBlur}
          value={text}
          ref={ref => (this.inputRef = ref)}
        />
        {/* </Animated.View> */}

        <Animated.View style={helperContainerStyle}>
          <View style={styles.flex}>
            <Helper
              style={errorStyle}
              text={error}
              focusAnimation={new Animated.Value(0)}>
              {error}
            </Helper>
            <Helper
              style={titleStyle}
              text={title}
              focusAnimation={new Animated.Value(0)}
            />
          </View>
          <Counter
            baseColor={overrideBaseColor}
            {...{errorColor, count, limit}}
          />
        </Animated.View>
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

  input: {
    top: 2,
    height: 24,
    fontSize: CMSStyleSheet.fontSize,
    padding: 0,
    margin: 0,
  },

  flex: {
    flex: 1,
  },
});

export default inject('appStore')(observer(InputText));

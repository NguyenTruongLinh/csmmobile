import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, Text, View, Animated} from 'react-native';
import {IconCustom} from '../CMSStyleSheet';
import CMSColors from '../../styles/cmscolors';
import Ripple from 'react-native-material-ripple';

class CMSPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visibility: false,
      expanded: false,
      animation: new Animated.Value(1),
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({visibility: true});
    }, 100);
  }

  toggle = () => {
    const {expanded} = this.state;
    const {onPress} = this.props;
    this.setState({expanded: !expanded});

    if (onPress) onPress();
  };

  setMaxHeight = event => {
    if (!event.nativeEvent || !event.nativeEvent.layout) return;

    const maxHeight = event.nativeEvent.layout.height;
    this.setState({maxHeight});
  };

  setMinHeight = event => {
    if (!event.nativeEvent || !event.nativeEvent.layout) return;
    const minHeight = event.nativeEvent.layout.height;
    this.state.animation.setValue(minHeight);
    this.setState({minHeight});
  };

  renderHeader = () => {
    const {header} = this.props;
    const {expanded} = this.state;
    const icon = expanded ? (
      <IconCustom
        name="expand-arrow"
        size={14}
        color={CMSColors.DividerColor}
      />
    ) : (
      <IconCustom
        name="expand-button"
        size={14}
        color={CMSColors.DividerColor}
      />
    );

    if (typeof header === 'function') {
      return header();
    } else if (typeof header === 'string') {
      return (
        <View style={styles.button}>
          <Text style={styles.title}>{header}</Text>
          {icon}
        </View>
      );
    } else if (typeof header === 'object') {
      return header;
    } else {
      return (
        <View style={styles.button}>
          <Text style={styles.title}>
            [Must be String, or Function that {'\n'}
            render React Element]
          </Text>
          {icon}
        </View>
      );
    }
  };

  render() {
    const {children, style, renderContentCustom} = this.props;
    const {expanded, visibility} = this.state;
    return (
      <Animated.View
        style={[
          styles.container,
          style,
          {
            overflow: 'hidden',
          },
        ]}>
        <View style={styles.container_header}>
          {renderContentCustom}
          <Ripple
            ref={ref => (this._header = ref)}
            activeOpacity={1}
            onPress={this.toggle}
            style={styles.buttonContain}
            onLayout={this.setMinHeight}>
            {this.renderHeader()}
          </Ripple>
        </View>
        {visibility && expanded && (
          <View onLayout={this.setMaxHeight}>{children}</View>
        )}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  container_header: {
    flexDirection: 'row',
  },
  title: {
    padding: 10,
    color: '#2a2f43',
    fontWeight: 'bold',
  },
  buttonContain: {
    justifyContent: 'center',
    flex: 1,
    alignItems: 'flex-end',
  },
  button: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonImage: {
    width: 30,
    height: 25,
  },
});

CMSPanel.propTypes = {
  header: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object,
  ]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  onPress: PropTypes.func,
  children: PropTypes.element.isRequired,
};

export default CMSPanel;

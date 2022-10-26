import React from 'react';
import {Image} from 'react-native';

export default class FullWidthImage extends React.Component {
  static propTypes = {
    width: number,
    height: number,
    stretched: boolean,
  };

  constructor(props) {
    super(props);

    Image.getSize(props.source.uri, (w, h) => {
      console.log(w);
      console.log(h);
    });
    this.state = {width: props.width, height: props.height, stretched: false};
  }

  onLayout = event => {
    if (!this.state.stretched) {
      const width = this.props.viewWidth; //Dimensions.get('window').width;
      const height =
        (width * event.nativeEvent.layout.height) /
        event.nativeEvent.layout.width;
      this.setState({width, height, stretched: true});
    }
  };

  render() {
    const {style} = this.props;
    const {width, height} = this.state;

    return (
      <Image
        {...this.props}
        style={[style, {width, height}]}
        onLayout={this.onLayout}
      />
    );
  }
}

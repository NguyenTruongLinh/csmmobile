import React from 'react';
import {inject, observer} from 'mobx-react';
import PropTypes from 'prop-types';

import {AirbnbRating} from 'react-native-ratings';

import styles from '../styles/detailStyles';
import theme from '../../../styles/appearance';
import {Text, View} from 'react-native';

class RatingDetail extends React.Component {
  static propTypes = {
    rating: PropTypes.object,
    onRatingChange: PropTypes.func,
  };

  static defaultProps = {
    rating: {},
    onRatingChange: () => {},
  };

  render() {
    const {rating, appStore, onRatingChange} = this.props;
    const {appearance} = appStore;
    const {rateId, rateName} = rating;

    return (
      <View style={[styles.ratingContainer, theme[appearance].container]}>
        <AirbnbRating
          type="star"
          showRating={false}
          ratingCount={5}
          defaultRating={rateId == -1 ? rateId : 5 - rateId}
          size={30}
          allowEmpty={true}
          onFinishRating={onRatingChange}
        />
        <Text style={[{padding: 8}, theme[appearance].text]}>{rateName}</Text>
      </View>
    );
  }
}

export default inject('appStore')(observer(RatingDetail));

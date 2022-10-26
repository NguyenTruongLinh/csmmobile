import React from 'react';
import {Dimensions, Text, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';
import {DateTime} from 'luxon';

import CMSImage from '../../../../components/containers/CMSImage';
import CMSRipple from '../../../../components/controls/CMSRipple';
import {IconCustom} from '../../../../components/CMSStyleSheet';
import ExceptionFlags from './exceptionFlags';

import theme from '../../../../styles/appearance';
import styles from '../../styles/transactionsStyles';
import CMSColors from '../../../../styles/cmscolors';

import ROUTERS from '../../../../consts/routes';
import {DateFormat} from '../../../../consts/misc';

const ALERTS_GRID_LAYOUT = 2;
const {width} = Dimensions.get('window');
const itemWidth = width / ALERTS_GRID_LAYOUT - 15;

class ItemGridView extends React.Component {
  static PropTypes = {
    data: PropTypes.object,
  };

  static defaultProps = {
    data: {},
  };

  gotoTransactionDetail = trans => {
    const {exceptionStore, appStore} = this.props;
    __DEV__ && console.log('GOND SMARTER Select trans: ', trans);
    exceptionStore.selectTransaction(trans.id);

    appStore.naviService.push(ROUTERS.TRANS_DETAIL);
  };

  render() {
    const {exceptionStore, appStore, data} = this.props;
    const {appearance} = appStore;

    return (
      <CMSRipple
        onPress={() => {
          this.gotoTransactionDetail(data);
        }}
        underlayColor={CMSColors.Underlay}
        style={[
          styles.gridItemContainer,
          {
            width: itemWidth,
          },
          theme[appearance].modalContainer,
        ]}>
        <View
          style={{
            width: itemWidth,
            height: Math.floor((itemWidth * 3) / 4),
          }}>
          <CMSImage
            id={'grid_' + data.tranId} //DateTime.now().toMillis()}
            src={data.image ? data.image : undefined}
            styleImage={[
              styles.alertThumbGrid,
              {width: itemWidth, height: Math.floor((itemWidth * 3) / 4)},
            ]}
            styles={styles.gridSnapshot}
            twoStepsLoading={true}
            dataCompleteHandler={(_, image) => {
              if (image) {
                data.saveImage(image);
              }
            }}
            domain={exceptionStore.getTransactionSnapShot(data)}
          />
        </View>
        <View style={styles.gridInfoContainer}>
          <View style={styles.gridInfoLeft}>
            <Text style={[styles.transNoText, theme[appearance].text]}>
              #{data.tranNo}
            </Text>

            <View style={styles.thumbSub}>
              <View style={styles.thumbSubIcon}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={theme[appearance].iconColor}
                />
              </View>
              <Text style={[styles.transDateText, theme[appearance].text]}>
                {DateTime.fromISO(data.tranDate, {zone: 'utc'}).toFormat(
                  DateFormat.Alert_Date
                )}
              </Text>
            </View>
          </View>
          <View style={styles.transInfoFlags}>
            <ExceptionFlags trans={data} />
          </View>
        </View>
      </CMSRipple>
    );
  }
}

export default inject('appStore', 'exceptionStore')(observer(ItemGridView));

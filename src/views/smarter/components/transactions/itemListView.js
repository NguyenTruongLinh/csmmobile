import React from 'react';
import {Text, View} from 'react-native';
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

class ItemListView extends React.Component {
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
    const {appStore, exceptionStore, data} = this.props;
    const {appearance} = appStore;

    return (
      <CMSRipple
        style={[
          styles.alertRipple,
          theme[appearance].container,
          theme[appearance].borderColor,
        ]}
        underlayColor={CMSColors.Underlay}
        onPress={() => this.gotoTransactionDetail(data)}>
        <View style={styles.transContainer}>
          <CMSImage
            id={'list_' + data.tranId}
            src={!data.isCloud ? data.snapshot : undefined}
            srcUrl={data.isCloud ? data.snapshot : undefined}
            domain={exceptionStore.getTransactionSnapShot(data)}
            dataCompleteHandler={(_, imageData) => {
              if (imageData) {
                data.saveImage(imageData);
              }
            }}
            twoStepsLoading={true}
            styleImage={styles.alertThumb}
            styles={styles.thumbContainer}
          />
          <View style={styles.transInfoContainer}>
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
        </View>
        <View style={styles.transInfoFlags}>
          <ExceptionFlags trans={data} />
        </View>
      </CMSRipple>
    );
  }
}

export default inject('appStore', 'exceptionStore')(observer(ItemListView));

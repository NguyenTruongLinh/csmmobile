import React from 'react';
import {
  View,
  FlatList,
  Text,
  Modal as ModalBase,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {inject, observer} from 'mobx-react';

import Ripple from 'react-native-material-ripple';

import Button from '../../components/controls/Button';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import ExceptionFilter from '../../components/views/ExceptionFilter';
import TemperatureFilter from '../../components/views/TemperatureFilterModal';
import {Icon} from '../../components/CMSStyleSheet';

import commonStyles from '../../styles/commons.style';
import variable from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/notifyStyles';

import {
  AlertTypes as C_AlertTypes,
  TEMPERATURE_ALARMS_TYPES,
} from '../../consts/misc';
import {Settings as SettingsTxt} from '../../localization/texts';
import {compareArrays, isNullOrUndef} from '../../util/general.js';

const ModalHeightPercentage = variable.ModalHeightPercentage;

const ModalTypes = {
  none: 0,
  exceptions: 1,
  temperature: 2,
  last: 2,
};

class NotifySettingView extends React.Component {
  constructor(props) {
    super(props);
    this.onDismissModal = this.onDismissModal.bind(this);

    this.state = {
      selectedNotifies: [],
      selectedExceptions: [],
      temperatureAlarmSelected: [],
      dataTemperatureAlarms: [],
      showedModal: ModalTypes.none,
      notifySettingData: [],
      modalheight: Dimensions.get('window').height * ModalHeightPercentage,
    };
  }

  async componentDidMount() {
    __DEV__ && console.log('NotifySettingView componentDidMount ');

    const [res, _] = await Promise.all([
      this.props.userStore.getNotifySettings(),
      this.props.exceptionStore.getExceptionTypes(),
    ]);
    const {selectedNotifies, selectedExceptions} =
      this.props.userStore.settings;
    if (res) {
      this.setState({
        selectedNotifies: [...selectedNotifies],
        selectedExceptions: [...selectedExceptions],
        notifySettingData: this.buildData(selectedNotifies),
        temperatureAlarmSelected: selectedNotifies
          ? TEMPERATURE_ALARMS_TYPES.filter(item =>
              selectedNotifies.includes(item)
            )
          : [],
      });
    }
    this.refreshSaveButton();
  }

  buildData = selectedAlerts => {
    let {alertTypes} = this.props.userStore.settings;
    // __DEV__ && console.log('GOND buildDataNotify alertTypes = ', alertTypes);
    if (!alertTypes) return [];
    let result = [];
    let alertAI = {
      id: 36,
      name: 'VA detection',
      isCheck:
        selectedAlerts &&
        selectedAlerts.includes(C_AlertTypes.DVR_VA_detection),
    };
    let alertSensor = {
      id: 9,
      name: 'Sensor triggered',
      isCheck:
        selectedAlerts &&
        selectedAlerts.includes(C_AlertTypes.DVR_Sensor_Triggered),
    };
    let posExceptions = {
      id: 222,
      name: 'POS Exceptions',
      isCheck:
        selectedAlerts && selectedAlerts.includes(C_AlertTypes.POS_Exceptions),
    };
    // dongpt: add Ax19
    let temperatureAlerts = {
      id: C_AlertTypes.Alarm_Temperature,
      name: 'Temperature alarm',
      isCheck:
        selectedAlerts &&
        (selectedAlerts.includes(C_AlertTypes.TEMPERATURE_OUT_OF_RANGE) ||
          selectedAlerts.includes(C_AlertTypes.TEMPERATURE_NOT_WEAR_MASK) ||
          selectedAlerts.includes(
            C_AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY
          )),
    };
    let sdAlerts = {
      id: C_AlertTypes.SOCIAL_DISTANCE,
      name: 'Social distance',
      isCheck:
        selectedAlerts && selectedAlerts.includes(C_AlertTypes.SOCIAL_DISTANCE),
    };
    let oamAlert = {
      id: C_AlertTypes.OAM,
      name: 'OAM',
      isCheck: selectedAlerts && selectedAlerts.includes(C_AlertTypes.OAM),
    };
    result.push(posExceptions);
    result.push(temperatureAlerts);
    result.push(alertAI);
    result.push(alertSensor);
    result.push(sdAlerts);
    result.push(oamAlert);
    // let AlertTypeFilter = AlertTypes.filter(x => (x.id != 37 && x.id != 107 && x.id != 108));
    // console.log('GOND *** AlertTypes = ', AlertTypes);
    let AlertTypeFilter = alertTypes.filter(
      x =>
        ![
          37, 107, 108,
          // temperature alarms (Ax19)
          113, 114, 115,
        ].includes(x.id)
    );
    AlertTypeFilter.map(x => {
      let item = {
        ...x,
        isCheck: selectedAlerts
          ? selectedAlerts.includes(x.id)
            ? true
            : false
          : false,
      };
      result.push(item);
    });

    return result;
  };

  onRefresh = () => {
    this.props.userStore.getNotifySettings();
  };

  onOpenModal = type => {
    if (this.state.showedModal != ModalTypes.none || type > ModalTypes.last)
      return;
    this.setState({showedModal: type});
  };

  onSubmitSetting = (isok, param) => {
    if (isok) {
      if (!isNullOrUndef(param.selectedAlarms)) {
        this.setState({selectedExceptions: param.selectedAlarms});
        if (param.selectedAlarms.length == 0)
          this.setState({
            selectedNotifies: this.state.selectedNotifies.filter(
              id => id != 222
            ),
          });
        else {
          const newNotify = this.state.selectedNotifies;
          newNotify.push(222);
          this.setState({selectedNotifies: newNotify});
        }

        const newSettings = {
          selectedNotifies: this.props.userStore.settings.selectedNotifies,
          selectedExceptions: this.state.selectedExceptions,
        };

        // let settingsave = JSON.stringify(settings);
        this.props.userStore.updateNotifySettings(newSettings);
      } else if (!isNullOrUndef(param.selectedTemperatureAlarms)) {
        let newSelectedList = this.state.selectedNotifies.filter(
          item => !TEMPERATURE_ALARMS_TYPES.includes(item)
        );
        newSelectedList = newSelectedList.concat(
          param.selectedTemperatureAlarms
        );
        // console.log('GOND onSubmitNotifyModal selectedList = ', newSelectedList)
        this.setState({
          selectedNotifies: newSelectedList,
          temperatureAlarmSelected: param.selectedTemperatureAlarms,
          notifySettingData: this.buildData(newSelectedList),
        });
        this.refreshSaveButton();
      }
    }

    this.onDismissModal();
  };

  onSelectNotifyItem(item) {
    let newNotifies = this.state.selectedNotifies;
    if (item.id == 222) {
      this.onOpenModal(ModalTypes.exceptions);
    } else if (item.id == C_AlertTypes.Alarm_Temperature) {
      this.onOpenModal(ModalTypes.temperature);
    } else {
      if (this.state.selectedNotifies.includes(item.id)) {
        newNotifies = newNotifies.filter(id => id != item.id);
        this.setState({
          selectedNotifies: newNotifies,
          notifySettingData: this.buildData(newNotifies),
        });
      } else {
        newNotifies = [item.id, ...newNotifies];
        this.setState({
          selectedNotifies: newNotifies,
          notifySettingData: this.buildData(newNotifies),
        });
      }

      this.refreshSaveButton();
    }
  }

  refreshSaveButton() {
    this.props.navigation.setOptions({
      headerRight: () => (
        <Button
          style={commonStyles.buttonSave}
          caption={SettingsTxt.save}
          enable={this.canSave()}
          onPress={this.updateNotifySettings.bind(this)}
          styleCaption={commonStyles.buttonSaveText}
          type="flat"
        />
      ),
    });
  }

  render_FilterModel = () => {
    let {showedModal, modalheight, selectedExceptions} = this.state;
    let {exceptionTypesData} = this.props.exceptionStore;
    // console.log(
    //   'GOND render_FilterModel, exceptionTypesData = ',
    //   exceptionTypesData
    // );

    const {width, height} = Dimensions.get('window');
    let init_height =
      (height - variable.StatusBarHeight) * ModalHeightPercentage;
    let init_width = (width - variable.StatusBarHeight) * ModalHeightPercentage;
    // __DEV__ && console.log('GOND render_FilterModel, init_height = ', init_height);
    return (
      <ModalBase
        animationType={'slide'}
        transparent={true}
        isDisabled={false}
        backdrop={true}
        coverScreen={true}
        visible={showedModal == ModalTypes.exceptions}
        onRequestClose={this.onDismissModal}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={{
              flex: 1 - ModalHeightPercentage,
              backgroundColor: CMSColors.BorderColor,
            }}
            activeOpacity={1}
            onPress={this.onDismissModal}
          />
          <ExceptionFilter
            exceptions={exceptionTypesData}
            initheight={Math.floor(init_height)}
            initwidth={Math.floor(init_width)}
            rotatable={this.props.Rotatable}
            selectedAlarms={selectedExceptions}
            onSubmit={this.onSubmitSetting}
          />
        </View>
      </ModalBase>
    );
  };

  onDismissModal() {
    this.setState({showedModal: ModalTypes.none});
  }

  renderTemperatureAlarmsModal = () => {
    let {showedModal, modalheight} = this.state;

    const {width, height} = Dimensions.get('window');
    let init_height =
      (height - variable.StatusBarHeight) * ModalHeightPercentage;
    let init_width = (width - variable.StatusBarHeight) * ModalHeightPercentage;
    return (
      <ModalBase
        animationType={'slide'}
        transparent={true}
        isDisabled={false}
        backdrop={true}
        coverScreen={true}
        visible={showedModal == ModalTypes.temperature}
        onRequestClose={this.onDismissModal}>
        <View style={styles.alarmsModalWrapper}>
          <TouchableOpacity
            style={{
              flex: 1 - ModalHeightPercentage,
              backgroundColor: CMSColors.BorderColor,
            }}
            activeOpacity={1}
            onPress={this.onDismissModal}
          />
          <TemperatureFilter
            tempAlarms={this.state.dataTemperatureAlarms}
            initheight={Math.floor(init_height)}
            initwidth={Math.floor(init_width)}
            Rotatable={this.props.Rotatable}
            selectedAlarms={this.state.temperatureAlarmSelected}
            onSubmit={this.onSubmitSetting}
          />
        </View>
      </ModalBase>
    );
  };

  renderRow(rowData) {
    if (!rowData) return;
    let {item} = rowData;
    const {appearance} = this.props.appStore;

    //POS Exception
    let iconL = null;
    let filterModal = <View></View>;
    let selectedCount = 0;
    if (item.id == 222) {
      item.isCheck = this.state.selectedExceptions.length > 0; // ? true : false;
      selectedCount = this.state.selectedExceptions.length;
      let filer_modal = this.render_FilterModel();
      iconL = (
        <View style={[styles.containIconCheck]}>
          <CMSTouchableIcon
            size={14}
            color={theme[appearance].iconColor}
            iconCustom="keyboard-right-arrow-button"
            style={styles.rowIcon}
          />
        </View>
      );

      filterModal = <View>{filer_modal}</View>;
    } else if (item.id == C_AlertTypes.Alarm_Temperature) {
      let alarmFilterModal = this.renderTemperatureAlarmsModal();
      selectedCount = this.state.temperatureAlarmSelected.length;
      iconL = (
        <View style={[styles.containIconCheck]}>
          <CMSTouchableIcon
            size={14}
            color={theme[appearance].iconColor}
            // disabled={this.state.selectedExceptions.length == 0}
            iconCustom="keyboard-right-arrow-button"
          />
        </View>
      );
      filterModal = <View>{alarmFilterModal}</View>;
    } else {
      iconL =
        item.isCheck == true ? (
          <View style={[styles.containIconCheck]}>
            <Icon
              name="check-square"
              color={CMSColors.PrimaryActive}
              size={24}
            />
          </View>
        ) : (
          <View style={[styles.containIconCheck]}>
            <Icon name="square-o" color="#757575" size={24} />
          </View>
        );
    }

    return (
      <Ripple
        rippleOpacity={0.87}
        onPress={() => this.onSelectNotifyItem(item)}>
        <View
          style={[
            styles.rowList,
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}>
          <View
            style={[
              styles.rowButton_contain_name,
              theme[appearance].container,
            ]}>
            <Text style={[styles.rowButton_name, theme[appearance].text]}>
              {item.name}
              {selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Text>
          </View>
          {iconL}
          {filterModal}
        </View>
      </Ripple>
    );
  }

  canSave = () => {
    const newSettings = this.state.selectedNotifies;
    const currentSettings = [...this.props.userStore.settings.selectedNotifies];
    if (
      !newSettings ||
      !this.props.userStore.settings ||
      isNullOrUndef(currentSettings)
    ) {
      return false;
    }

    return !compareArrays(newSettings.sort(), currentSettings.sort());
  };

  updateNotifySettings() {
    const {selectedNotifies, selectedExceptions} = this.state;
    this.props.userStore.updateNotifySettings({
      selectedNotifies,
      selectedExceptions,
    });
  }

  render() {
    const {appearance} = this.props.appStore;

    return (
      <View style={[styles.all, theme[appearance].container]}>
        <View style={styles.firstContainer}>
          <FlatList
            ref={ref => (this.flatListRef = ref)}
            style={commonStyles.PullToRefreshListView_Style}
            data={this.state.notifySettingData}
            renderItem={this.renderRow.bind(this)}
          />
        </View>
      </View>
    );
  }
}

export default inject(
  'userStore',
  'exceptionStore',
  'appStore'
)(observer(NotifySettingView));

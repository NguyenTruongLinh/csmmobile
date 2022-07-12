import React, {Component, PropTypes} from 'react';
import {
  Text,
  View,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
  FlatList,
} from 'react-native';
// import {CalendarList} from 'react-native-calendars';
import {DateTime} from 'luxon';
import Ripple from 'react-native-material-ripple';
import Accordion from 'react-native-collapsible/Accordion';
// import Modal from 'react-native-modal';
import Modal from '../../components/views/CMSModal';

import CMSCalendarRange from '../../components/views/CMSCalendarRange';
import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import {Icon, IconCustom, MaterialIcons} from '../../components/CMSStyleSheet';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import {DateFormat} from '../../consts/misc';
import {
  SMARTER as SMARTER_TXT,
  Comps as CompTxt,
} from '../../localization/texts';

import {compareStrings} from '../../util/general';

const FILTER_SECTIONS = {
  CALENDAR: 0,
  SITES: 1,
};

FILTER_PARAMS = [
  {
    id: FILTER_SECTIONS.CALENDAR,
    key: 'sec_calendar',
  },
  {
    id: FILTER_SECTIONS.SITES,
    key: 'sec_sites',
  },
];

const SECTION_HEADER_HEIGHT = 48;

export default class ExceptionSearchModal extends Component {
  static defaultProps = {
    onSubmit: ({dateFrom, dateTo, selectedSites}) =>
      __DEV__ && console.log('GOND ExceptionSearchModal onSubmit not defined!'),
    onDismiss: () =>
      __DEV__ &&
      console.log('GOND ExceptionSearchModal onDismiss not defined!'),
    dateFrom: DateTime.utc().minus({days: 1}).startOf('day'),
    dateTo: DateTime.utc().minus({days: 1}).endOf('day'),
    sites: [],
    isVisible: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      // istest : false,
      activeSection: 'sec_calendar',
      isSortAZ: true,
      dateFrom: props.dateFrom,
      dateTo: props.dateTo,
      selectedSites: props.sites.map(s => s.key),
      contentHeight: Dimensions.get('window').height * 0.57, // 460,
      waitForSiteData: true,
    };

    this.calendarRef = null;
  }

  componentDidMount() {
    // if (this.props.Rotatable) {
    //   Dimensions.addEventListener('change', this.onDimensionChange);
    // }
    // this.onDimensionChange({window: Dimensions.get('window')});
  }

  componentWillUnmount() {
    // if (this.props.Rotatable) {
    //   Dimensions.removeEventListener('change', this.onDimensionChange);
    // }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    let {sites} = nextProps;
    if (prevState.waitForSiteData && sites.length > 0) {
      return {
        selectedSites: sites.map(s => s.key),
        waitForSiteData: false,
      };
    }

    return {};
  }

  onContentLayout = event => {
    const {width, height} = event.nativeEvent.layout;

    const contentHeight = height - SECTION_HEADER_HEIGHT * FILTER_PARAMS.length;
    __DEV__ &&
      console.log('GOND on Modal ContentLayout: ', height, contentHeight);
    if (contentHeight < 0) {
      __DEV__ && console.log('GOND on Modal ContentLayout error!');
      return;
    }
    this.setState({
      contentHeight,
    });
  };

  onDismiss = () => {
    const {sitesStore, onDismiss} = this.props;
    sitesStore && sitesStore.setSiteFilter('');
    onDismiss && onDismiss();
  };

  onSubmit = () => {
    const {sitesStore, onSubmit} = this.props;
    const {dateFrom, dateTo, selectedSites} = this.state;
    sitesStore && sitesStore.setSiteFilter('');
    onSubmit && onSubmit({dateFrom, dateTo, selectedSites});
  };

  onChangeSection = openSections => {
    if (openSections.length === 0) this.setState({activeSection: null});
    __DEV__ &&
      console.log(
        'GOND SMARTER filter on section changed: ',
        openSections,
        ', current: ',
        this.state.activeSection
      );
    const selectedSection = openSections.find(
      s => s != this.state.activeSection
    );
    __DEV__ &&
      console.log('GOND SMARTER filter selectedSections: ', selectedSection);

    if (selectedSection) this.setState({activeSection: selectedSection});
  };

  onDateChange = ({from, to}) => {
    __DEV__ &&
      console.log('GOND SmartER filter onDateChange, from ', from.toISO());
    this.setState({dateFrom: from, dateTo: to});
  };

  isSelectAllSites = () => {
    const {sitesStore, sites, filteredSites} = this.props;
    const {selectedSites, isSortAZ, contentHeight} = this.state;

    __DEV__ &&
      console.log(
        'GOND compare selected sites: ',
        selectedSites,
        sites,
        ' --- length cmp = ',
        sites.length === selectedSites.length,
        ' ---  find diff = ',
        sites.find(s => !selectedSites.includes(s.key))
      );

    return (
      filteredSites.length === selectedSites.length &&
      !(filteredSites.find(s => !selectedSites.includes(s.key)) ?? false)
    );
  };

  onSelectAllSites = () => {
    const {sitesStore, sites, filteredSites} = this.props;
    this.setState({
      selectedSites: this.isSelectAllSites()
        ? []
        : filteredSites.map(s => s.key), //this.props.sites.map(s => s.key),
    });
  };

  renderHeader = () => {
    return (
      <View
        style={[
          commonStyles.modalHeader,
          commonStyles.modalHeaderSeparator,
          {
            flex: 10,
          },
        ]}>
        <Text style={[commonStyles.modalTitle]}>
          {SMARTER_TXT.FILTER_MODAL_TITLE}
        </Text>
      </View>
    );
  };

  renderFooter = () => {
    return (
      <View
        style={[commonStyles.modalFooter, {flex: 15, paddingHorizontal: 12}]}>
        <View style={commonStyles.modalButtonCancelContainer}>
          <Button
            style={commonStyles.modalButtonCancel}
            caption={CompTxt.cancelButton}
            type="flat"
            enable={true}
            onPress={() => {
              this.onDismiss();
            }}
          />
        </View>
        <View style={commonStyles.modalButtonApplyContainer}>
          <Button
            style={commonStyles.modalButtonApply}
            caption={CompTxt.applyButton}
            captionStyle={{color: CMSColors.White}}
            type="flat"
            // enable={this.state.selectedSites.length > 0}
            enable={true}
            onPress={() => {
              this.onSubmit();
            }}
          />
        </View>
      </View>
    );
  };

  renderContent = () => {
    // __DEV__ &&
    //   console.log(
    //     'GOND render SMARTERFilter active Sections = ',
    //     this.state.activeSection
    //   );

    return (
      <View style={{flex: 75}} onLayout={this.onContentLayout}>
        <Accordion
          expandMultiple={false}
          // sections={Object.values(FILTER_SECTIONS)}
          sections={FILTER_PARAMS}
          activeSections={[this.state.activeSection]}
          renderHeader={this.renderSectionHeader}
          renderContent={this.renderSectionContent}
          onChange={this.onChangeSection}
          touchableComponent={props => <Ripple {...props} />}
          // renderAsFlatList={true}
          keyExtractor={item => item.key}
        />
      </View>
    );
  };

  // renderSectionHeader = (section, index, isActive) => {
  renderSectionHeader = (item, index, isActive) => {
    const {dateFrom, dateTo, selectedSites} = this.state;

    switch (item.id) {
      case FILTER_SECTIONS.CALENDAR:
        return (
          <View style={styles.sectionHeaderContainer}>
            <IconCustom
              name="power-connection-indicator"
              color={CMSColors.ColorText}
              size={22}
            />
            <View style={{justifyContent: 'center', marginLeft: 12}}>
              <Text style={{fontSize: 16, color: CMSColors.ColorText}}>
                {dateFrom.toFormat(DateFormat.POS_Filter_Date) +
                  ' - ' +
                  dateTo.toFormat(DateFormat.POS_Filter_Date)}
              </Text>
            </View>
            <View style={{flex: 1, alignItems: 'flex-end'}}>
              <IconCustom
                name={isActive ? 'expand-arrow' : 'expand-button'}
                color={CMSColors.ColorText}
                size={22}
              />
            </View>
          </View>
        );
      case FILTER_SECTIONS.SITES:
        return (
          <View style={styles.sectionHeaderContainer}>
            <IconCustom name="sites" color={CMSColors.ColorText} size={22} />
            <View style={{justifyContent: 'center', marginLeft: 12}}>
              <Text style={{fontSize: 16, color: CMSColors.ColorText}}>
                {'' + selectedSites.length + ' sites selected'}
              </Text>
            </View>
            <View style={{flex: 1, alignItems: 'flex-end'}}>
              <IconCustom
                name={isActive ? 'expand-arrow' : 'expand-button'}
                color={CMSColors.ColorText}
                size={22}
              />
            </View>
          </View>
        );
    }
    return null;
  };

  renderSiteItem = ({item}) => {
    const {selectedSites} = this.state;
    // __DEV__ && console.log('GOND renderSiteItem selected: ', selectedSites);
    const isSelected = selectedSites.includes(item.key);

    return (
      <Ripple
        style={{
          backgroundColor: CMSColors.White,
          height: 40,
          flexDirection: 'row',
          paddingHorizontal: 12,
          alignItems: 'center',
        }}
        onPress={() => {
          this.setState({
            selectedSites: isSelected
              ? selectedSites.filter(s => s != item.key)
              : [...selectedSites, item.key],
          });
        }}>
        <MaterialIcons
          name={isSelected ? 'check-box' : 'check-box-outline-blank'}
          color={isSelected ? CMSColors.PrimaryActive : CMSColors.ColorText}
          size={22}
        />
        <View style={styles.siteNameContainer}>
          <Text style={styles.siteNameText}>{item.name}</Text>
        </View>
      </Ripple>
    );
  };

  onSiteFilterChange = value => {
    const {sitesStore, sites, filteredSites} = this.props;
    this.setState({selectedSites: []});
    sitesStore.setSiteFilter(value);
  };

  renderSitesSelection = () => {
    const {sitesStore, sites, filteredSites} = this.props;
    const {selectedSites, isSortAZ, contentHeight} = this.state;
    const isSelectedAll = this.isSelectAllSites();

    let sortedSites = filteredSites.slice(0, filteredSites.length);
    sortedSites.sort(
      (a, b) => (isSortAZ ? 1 : -1) * compareStrings(a.name, b.name, false)
    );

    return (
      <View style={{backgroundColor: CMSColors.White, height: contentHeight}}>
        <View
          style={{
            height: 40,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: CMSColors.White,
            paddingLeft: 15,
            paddingRight: 2,
          }}>
          <Text
            style={{
              fontSize: 12,
              color:
                selectedSites.length == 0
                  ? CMSColors.Danger
                  : CMSColors.ColorText,
            }}>
            {selectedSites.length == 0
              ? 'Select at least 1 site'
              : '' + selectedSites.length + ' sites selected'}
          </Text>
          <View style={{flex: 1, alignItems: 'flex-end'}}>
            <Ripple
              style={styles.button_sort}
              onPress={() => this.setState({isSortAZ: !isSortAZ})}>
              <Icon
                name={isSortAZ == true ? 'sort-alpha-desc' : 'sort-alpha-asc'}
                color={CMSColors.PrimaryText}
                size={17}
              />
            </Ripple>
          </View>
        </View>
        <View style={styles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={sitesStore.siteFilter}
            onChangeText={this.onSiteFilterChange}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View>
        <View style={{height: '100%'}}>
          <Ripple
            style={{
              backgroundColor: CMSColors.White,
              height: 40,
              flexDirection: 'row',
              paddingHorizontal: 12,
              alignItems: 'center',
            }}
            onPress={this.onSelectAllSites}>
            <MaterialIcons
              name={isSelectedAll ? 'check-box' : 'check-box-outline-blank'}
              color={
                isSelectedAll ? CMSColors.PrimaryActive : CMSColors.ColorText
              }
              size={22}
            />
            <View style={styles.siteNameContainer}>
              <Text style={styles.siteNameText}>All</Text>
            </View>
          </Ripple>
          <View style={{height: contentHeight * 0.68}}>
            <FlatList
              data={sortedSites}
              keyExtractor={item => 'site_' + item.key}
              renderItem={this.renderSiteItem}
              style={{height: '100%'}}
              // getItemLayout={(data, index) => ({
              //   length: 40,
              //   offset: 40 * index,
              //   index,
              // })}
              // removeClippedSubviews={false}
            />
          </View>
        </View>
      </View>
    );
  };

  // renderSectionContent = (section, index, isActive) => {
  renderSectionContent = (item, index, isActive) => {
    const {dateFrom, dateTo, contentHeight} = this.state;
    if (!isActive) return;

    switch (item.id) {
      case FILTER_SECTIONS.CALENDAR:
        return (
          <View style={{height: contentHeight}}>
            <CMSCalendarRange
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateChange={this.onDateChange}
            />
          </View>
        );

        return (
          // <View style={{height: '100%'}}>
          <ScrollView
            ref={r => (this.calendarRef = r)}
            onContentSizeChange={() =>
              this.calendarRef &&
              this.calendarRef.scrollToEnd({animated: false})
            }
            style={{height: contentHeight, flex: 1}}>
            <CMSCalendarRange
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateChange={this.onDateChange}
            />
          </ScrollView>
          //</View>
        );
      case FILTER_SECTIONS.SITES:
        return this.renderSitesSelection();
    }
  };

  render() {
    __DEV__ &&
      console.log(
        ` selectedSites = `,
        JSON.stringify(this.state.selectedSites)
      );
    return (
      <Modal
        isVisible={this.props.isVisible}
        onBackdropPress={this.onDismiss}
        // onSwipeOut={() => this.setState({showFilterModal: false})}
        onBackButtonPress={this.onDismiss}
        panResponderThreshold={10}
        backdropOpacity={0.3}
        key="posFilterModal"
        name="posFilterModal"
        style={styles.modal}>
        <View style={commonStyles.modalContainer}>
          {this.renderHeader()}
          {this.renderContent()}
          {this.renderFooter()}
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    marginBottom: 0,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    flex: 1,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // padding: 5,
    paddingHorizontal: 12,
    height: SECTION_HEADER_HEIGHT,
    backgroundColor: CMSColors.White,
    borderBottomWidth: 0.5,
    borderColor: CMSColors.BorderColorListRow,
  },
  siteNameContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  siteNameText: {
    fontSize: 14,
  },
  button_sort: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatSearchBarContainer: {
    paddingLeft: 18,
    paddingRight: 4,
    height: 50,
    backgroundColor: CMSColors.White,
  },
});

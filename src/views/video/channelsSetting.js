import React, {Component} from 'react';
import {View, FlatList, Text, Dimensions, TouchableOpacity} from 'react-native';
import {inject, observer} from 'mobx-react';

import CMSImage from '../../components/containers/CMSImage';
import {Icon, IconCustom} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';
import styles from './styles/channelsSettingsStyles';

import snackbarUtil from '../../util/snackbar';
import {Settings as SettingsTxt} from '../../localization/texts';

const ITEMS_PER_ROW = 2;
const {width, height} = Dimensions.get('window');

class ChannelsSettingView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      width,
      height,
      loading: false,
      selectedChannels: props.videoStore.activeChannelNos ?? [],
      gridData: [],
    };
  }

  componentWillUnmount() {
    __DEV__ && console.log('ChannelsSettingView componentWillUnmount');
    this.onFilter('');
    this.props.videoStore.setShouldShowVideoMessage(true);
  }

  async componentDidMount() {
    const {videoStore} = this.props;
    __DEV__ && console.log('ChannelsSettingView componentDidMount');
    videoStore.setShouldShowVideoMessage(false);
    this.setHeader(false);
    if (!videoStore.allChannels || videoStore.allChannels.length == 0) {
      const result = await videoStore.getDisplayingChannels(true);
      if (!result) return;
      this.setState({
        selectedChannels: videoStore.activeChannelNos ?? [],
      });
    }
    this.setState({
      gridData: this.buildChannelsGridData(
        videoStore.filteredChannels,
        this.state.selectedChannels
      ),
    });
  }

  setHeader = enable => {
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader(enable))
      : null;

    this.props.navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          {searchButton}
          <Button
            style={commonStyles.buttonSave}
            caption={SettingsTxt.save}
            enable={enable}
            onPress={this.save}
            styleCaption={commonStyles.buttonSaveText}
            type="flat"
          />
        </View>
      ),
    });
  };

  save = async () => {
    const {videoStore, navigation} = this.props;
    this.setState({loading: true});
    const result = await videoStore.saveActiveChannels(
      this.state.selectedChannels
    );

    let newState = {};
    if (result) {
      newState = {
        selectedChannels: videoStore.activeChannelNos,
        gridData: this.buildChannelsGridData(
          videoStore.filteredChannels,
          videoStore.activeChannelNos
        ),
      };
      // reload live channels after saved
      videoStore.getVideoInfos();
      navigation.goBack();
      return;
    }
    this.setState({...newState, loading: false});
  };

  onLayout = event => {
    const {width, height} = event.nativeEvent.layout;
    this.setState({width, height});
  };

  onSelectChannel = channel => {
    const {selectedChannels} = this.state;
    const {maxReadyChannels} = this.props.videoStore;
    // __DEV__ && console.log('GOND onSelectChannel: ', selectedChannels);
    if (
      selectedChannels &&
      maxReadyChannels > 0 &&
      !selectedChannels.includes(channel.channelNo) &&
      selectedChannels.length >= maxReadyChannels
    ) {
      snackbarUtil.onError(
        SettingsTxt.EXCEED_MAX_CHANNELS_1 +
          maxReadyChannels +
          SettingsTxt.EXCEED_MAX_CHANNELS_2
      );
      return;
    }

    const updatedData = selectedChannels.includes(channel.channelNo)
      ? selectedChannels.filter(chNo => chNo != channel.channelNo)
      : [...selectedChannels, channel.channelNo];
    __DEV__ && console.log('GOND onSelectChannel updatedData:', updatedData);

    this.setState(
      {
        selectedChannels: updatedData,
        gridData: this.buildChannelsGridData(
          this.props.videoStore.filteredChannels,
          updatedData
        ),
      },
      () => {
        const {activeChannelNos} = this.props.videoStore;
        const channelsSet = new Set([
          ...this.state.selectedChannels,
          ...activeChannelNos,
        ]);
        this.setHeader(
          this.state.selectedChannels.length != activeChannelNos.length ||
            channelsSet.size != activeChannelNos.length
        );
      }
    );
  };

  onFilter = value => {
    const {videoStore} = this.props;
    videoStore.setChannelFilter(value);
    this.setState({
      gridData: this.buildChannelsGridData(
        videoStore.filteredChannels,
        this.state.selectedChannels
      ),
    });
  };

  buildChannelsGridData = (data, selected) => {
    if (!selected) return [];
    const totalRows = Math.ceil(data.length / ITEMS_PER_ROW);

    let result = [];
    const stateData = data.map(ch => ({
      ...ch,
      isActive: selected.includes(ch.channelNo),
    }));

    for (let i = 0; i < totalRows; i++) {
      let row = [];
      for (let j = 0; j < ITEMS_PER_ROW; j++) {
        const idx = ITEMS_PER_ROW * i + j;
        if (idx < stateData.length) row.push(stateData[idx]);
        else row.push({});
      }
      result.push(row);
    }
    __DEV__ &&
      console.log(`buildChannelsGridData result.length = `, result.length);
    this.setState({length: stateData.length});
    return result;
  };

  renderChannelItem = channel => {
    const {appearance} = this.props.appStore;

    return Object.keys(channel).length == 0 ? (
      <View key="ch_none" style={styles.itemNone} />
    ) : (
      <TouchableOpacity
        key={channel.kChannel}
        onPress={() => this.onSelectChannel(channel)}
        style={[styles.item, theme[appearance].modalContainer]}>
        <View style={styles.itemImageContainer}>
          <CMSImage
            resizeMode="cover"
            styles={styles.itemImageWrapper}
            styleImage={styles.itemImage}
            dataCompleteHandler={this.onChannelSnapshotLoaded}
            domain={{
              controller: 'channel',
              action: 'image',
              id: channel.kChannel,
            }}
          />
        </View>
        <View style={styles.itemContentContainer}>
          <View style={{justifyContent: 'center', paddingLeft: 7}}>
            <IconCustom
              name="videocam-filled-tool"
              color={CMSColors.Green}
              size={20}
            />
          </View>
          <View style={styles.itemTextContainer}>
            <Text numberOfLines={2} style={theme[appearance].text}>
              {channel.name}
            </Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Icon
            name={channel.isActive ? 'check-square' : 'square'}
            color={channel.isActive ? CMSColors.PrimaryActive : CMSColors.White}
            size={24}
          />
        </View>
      </TouchableOpacity>
    );
  };

  renderRow = ({item}) => {
    const rowViews = [];

    item.forEach(ch => {
      rowViews.push(this.renderChannelItem(ch));
    });

    return <View style={styles.itemContainer}>{rowViews}</View>;
  };

  render() {
    const {videoStore, appStore} = this.props;
    const {gridData, loading} = this.state;
    const {appearance} = appStore;

    return (
      <View style={[styles.container, theme[appearance].container]}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={videoStore.channelFilter}
        />
        <View
          style={[styles.summaryContainer, theme[appearance].headerListRow]}>
          <Text style={[styles.summaryText, theme[appearance].text]}>
            {this.state.length} channels
          </Text>
        </View>
        <View style={styles.listContainer} onLayout={this.onLayout}>
          <FlatList
            renderItem={this.renderRow}
            data={gridData}
            keyExtractor={(_, index) => 'chrow_' + index}
            onRefresh={() => videoStore.getDisplayingChannels(true)}
            refreshing={loading}
          />
        </View>
      </View>
    );
  }
}

export default inject('videoStore', 'appStore')(observer(ChannelsSettingView));

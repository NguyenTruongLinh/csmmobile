import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  StatusBar,
  BackHandler,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';

import CMSImage from '../../components/containers/CMSImage';
import {Icon, IconCustom} from '../../components/CMSStyleSheet';
import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import snackbarUtil from '../../util/snackbar';
import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import {
  Settings as SettingsTxt,
  Comps as CompTxt,
} from '../../localization/texts';

const ITEMS_PER_ROW = 2;
const ITEM_HEIGHT = 190;

class ChannelsSettingView extends Component {
  constructor(props) {
    super(props);
    const {width, height} = Dimensions.get('window');

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
  }

  async componentDidMount() {
    const {videoStore} = this.props;
    __DEV__ && console.log('ChannelsSettingView componentDidMount');
    this.setHeader(false);
    if (!videoStore.allChannels || videoStore.allChannels.length == 0) {
      const result = await videoStore.getDisplayingChannels();
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

    // reaction(
    //   () => videoStore.activeChannelNos,
    //   (value, previousValue) => {
    //     __DEV__ &&
    //       console.log(
    //         'GOND activeChannelNos updated',
    //         value,
    //         ' <= ',
    //         previousValue
    //       );
    //     this.setState({
    //       selectedChannels: value,
    //       gridData: this.buildChannelsGridData(videoStore.filteredChannels, value),
    //     });
    //   }
    // );
  }

  // componentDidUpdate(prevProps) {
  //   const {activeChannelNos} = this.props.videoStore;
  //   __DEV__ &&
  //     console.log(
  //       '>>>>> GOND selectedChannels updated',
  //       activeChannelNos,
  //       prevProps.videoStore.activeChannelNos
  //     );
  // }

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
    const {videoStore} = this.props;
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
    }
    this.setState({...newState, loading: false});
  };

  onLayout = event => {
    const {width, height} = event.nativeEvent.layout;
    this.setState({width, height});
  };

  onSelectChannel = channel => {
    const {selectedChannels} = this.state;
    // __DEV__ && console.log('GOND onSelectChannel: ', selectedChannels);

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
    // __DEV__ && console.log('GOND buildChannelsGridData channels: ', selected);

    if (!selected) return [];
    const totalRows = Math.ceil(data.length / ITEMS_PER_ROW);

    let result = [];
    const stateData = data.map(ch => ({
      ...ch,
      isActive: selected.includes(ch.channelNo),
    }));
    // __DEV__ && console.log('GOND buildChannelsGridData stateData: ', stateData);

    for (let i = 0; i < totalRows; i++) {
      let row = [];
      for (let j = 0; j < ITEMS_PER_ROW; j++) {
        const idx = ITEMS_PER_ROW * i + j;
        // __DEV__ &&
        //   console.log(
        //     'GOND buildChannelsGridData item : ',
        //     idx,
        //     stateData[idx]
        //   );
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
    __DEV__ && console.log('GOND renderChannelItem: ', channel);
    return Object.keys(channel).length == 0 ? (
      <View key="ch_none" style={{flex: 1}} />
    ) : (
      <TouchableOpacity
        key={channel.kChannel}
        onPress={() => this.onSelectChannel(channel)}
        style={styles.item}>
        <View
          style={{
            flex: 8,
          }}>
          <CMSImage
            resizeMode="cover"
            styleImage={{width: '100%', height: '100%'}}
            dataCompleteHandler={this.onChannelSnapshotLoaded}
            // zzz
            domain={{
              controller: 'channel',
              action: 'image',
              id: channel.kChannel,
            }}
          />
        </View>
        <View
          style={{
            flex: 3,
            flexDirection: 'row',
          }}>
          <View style={{justifyContent: 'center', paddingLeft: 7}}>
            <IconCustom
              name="videocam-filled-tool"
              color={CMSColors.Green}
              size={20}
            />
          </View>
          <View style={{flex: 1, justifyContent: 'center', padding: 7}}>
            <Text numberOfLines={2}>{channel.name}</Text>
          </View>
        </View>
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
          }}>
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
    const {width, height} = Dimensions.get('window');
    const rowViews = [];
    // __DEV__ && console.log('GOND channels setting row data: ', item);

    item.forEach(ch => {
      rowViews.push(this.renderChannelItem(ch));
    });

    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          // width: '100%',
          height: ITEM_HEIGHT,
          marginHorizontal: 10,
        }}>
        {rowViews}
      </View>
    );
  };

  render() {
    const {videoStore} = this.props;
    const {gridData, loading} = this.state;

    return (
      <View style={{flex: 1}}>
        {/* <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={videoStore.channelFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View> */}
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={videoStore.channelFilter}
        />
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>{this.state.length} channels</Text>
        </View>
        <View style={{flex: 1, marginBottom: 14}} onLayout={this.onLayout}>
          <FlatList
            renderItem={this.renderRow}
            data={gridData}
            keyExtractor={(item, index) => 'chrow_' + index}
            onRefresh={videoStore.getActiveChannels}
            refreshing={loading}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: CMSColors.HeaderListRow,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    paddingLeft: 24,
    textAlignVertical: 'center',
    color: CMSColors.RowOptions,
  },
  item: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: CMSColors.White,
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowRadius: 2,
        shadowColor: CMSColors.BoxShadow,
      },
      android: {
        elevation: 2,
      },
    }),
    margin: 6,
  },
});
export default inject('videoStore')(observer(ChannelsSettingView));

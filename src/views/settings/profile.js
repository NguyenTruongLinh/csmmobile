import React, {Component} from 'react';
import {View, Text, ActivityIndicator, StatusBar} from 'react-native';
// import { validation } from '../../util/validation.js'
// const img_header = require('../../assets/images/common/profile_header.jpg');
const initData: UserProfile = {
  UserID: null,
  FName: null,
  LName: null,
  Email: null,
};
const Fields = {
  firstname: 'firstname',
  lastname: 'lastname',
  email: 'email',
};

class ProfileView extends Component {
  constructor(props) {
    super(props);
  }

  ChangeProfile = () => {
    // this.setState({isShowSpinner: true});
    // initData.FName = this.state.firstname;
    // initData.LName = this.state.lastname;
    // initData.Email = this.state.email;
    // initData.UserID = this.props.user.UserID;
    // this.props.UpdateProfile(this.props.Services, initData);
  };

  // BuildParamsUserImage() {
  //   return {
  //     controller: Account.controller,
  //     action: Account.avartar,
  //     id: this.props.user.UserId,
  //   };
  // }

  render() {
    return <View></View>;
  }
}

export default ProfileView;

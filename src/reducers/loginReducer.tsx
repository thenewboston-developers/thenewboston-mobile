import { Reducer } from 'redux';
import { LoginActionTypes, LoginActions } from '../actions/loginActions';

export interface ILoginState {
    protocol: string;
    ipAddress: string;
    port: string;
    nickName: string;
    password: string;
}

const initialLoginState: ILoginState = {
    protocol: 'http',
    ipAddress: '',
    port: '80',
    nickName: '',
    password: '',
};

export const loginReducer: Reducer<ILoginState, LoginActions> = (
    state = initialLoginState,
    action
  ) => {
    switch (action.type) {
      case LoginActionTypes.PROTOCOL: {
        return {
          ...state,
          protocol: action.protocol
        };
      }
      case LoginActionTypes.IP_ADDRESS: {
        return {
          ...state,
          ipAddress: action.ipAddress
        };
      }
      case LoginActionTypes.PORT: {
        return {
            ...state,
            port: action.port
          };
      }
      case LoginActionTypes.NICK_NAME: {
        return {
            ...state,
            nickName: action.nickName
          };
      }
      case LoginActionTypes.PASSWORD: {
        return {
            ...state,
            password: action.password
          };
      }
      default:
        return state;
    }
  };

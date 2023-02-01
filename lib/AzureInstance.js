import {decode as atob} from 'base-64'
import AsyncStorage from "@react-native-async-storage/async-storage";

export default class AzureInstance {

  auth;

  constructor(credentials) {
    this.tenant_id = credentials.tenant_id || "common";
    this.authority = "https://login.microsoftonline.com/" + (this.tenant_id || "common");
    this.authorize_endpoint = "/oauth2/v2.0/authorize";
    this.redirect_uri = credentials.redirect_uri || "http://localhost:3000";
    this.token_endpoint = "/oauth2/v2.0/token";
    this.client_id = credentials.client_id;
    this.client_secret = credentials.client_secret;
    this.scope = credentials.scope;
    this.token = {};

    // function binding
    this.getConfig = this.getConfig.bind(this);
    this.setToken = this.setToken.bind(this);
    this.getToken = this.getToken.bind(this);
    this.getUserInfo = this.getUserInfo.bind(this);
  }

  getConfig() {
    return {
      authority: this.authority,
      authorize_endpoint: this.authorize_endpoint,
      token_endpoint: this.token_endpoint,
      client_id: this.client_id,
      client_secret: this.client_secret,
      redirect_uri: this.redirect_uri,
      scope: this.scope,
    };
  }

  setToken(token) {
    //current millis
    this.token = token;
    this.userData = JSON.parse(atob(token.accessToken.split('.')[1]));
    this.userData.username = this.userData.upn.split('@')[0];
    AsyncStorage.setItem('authToken', JSON.stringify(this.token))
    AsyncStorage.setItem('userData', JSON.stringify(this.userData))
    setTimeout(() => {
      this.updateToken()
    }, token.expires_in * 1000 - new Date().getTime());
  }

  getToken() {
    if (this.token !== undefined || Object.keys(this.token).length !== 0) {
      return this.token;
    }
  }

  updateToken() {
    if (this.token && Object.keys(this.token).length !== 0) {
      this.auth.refreshToken(this.token.refreshToken).then((token) => {
        this.setToken(token);
      })
    }
  }

  setAuth(auth) {
    this.auth = auth;
  }

  loadDataFromStorage() {
    return AsyncStorage.getItem('authToken').then((token) =>{
      if(token) {
        const lToken = JSON.parse(token);
        if ((lToken['expires_in']*1000) > Date.now()) {
          this.setToken(lToken);
        }else {
          this.token = {};
        }
      }
    });
  }

  isLoggedIn() {
    if (this.token !== undefined && Object.keys(this.token).length !== 0){
      return true;
    }
    return false;
  }

  logout() {
    this.token = {};
    AsyncStorage.removeItem('authToken');
    AsyncStorage.removeItem('userData');
  }

  getUserInfo() {
    if (this.token === undefined || Object.keys(this.token).length === 0) {
      throw new Error(
        "Access token is undefined, please authenticate using Auth first"
      );
    }

    return fetch("https://webservices.scientificnet.org/rest/cm/core/api/UserData/GetUserData/?domain=unibz&username=" + this.userData.username, {
      headers: {
        Authorization: "Bearer " + this.getToken().accessToken
      },
    })
      .then((response) => {
        return response.json();
      })
      .catch((err) => {
        // in case of error reject promise
        throw new Error(err);
      });
  }

  getMoney() {
    if (this.token === undefined || Object.keys(this.token).length === 0) {
      throw new Error(
        "Access token is undefined, please authenticate using Auth first"
      );
    }

    return fetch("https://webservices.scientificnet.org/rest/inepro/Budget/GetPersonal/?upn=" + this.userData.upn + "&username=" + this.userData.username + "&domain=unibz", {
      headers: {
        Authorization: "Bearer " + this.getToken().accessToken
      },
    })
        .then((response) => {
          return response.json();
        })
        .catch((err) => {
          throw new Error(err);
        })
  }

  getPriceList() {
    if (this.token === undefined || Object.keys(this.token).length === 0) {
      throw new Error(
        "Access token is undefined, please authenticate using Auth first"
      );
    }

    return fetch("https://webservices.scientificnet.org/rest/cm/mensa/api/prices/?upn=" + this.userData.upn, {
        headers: {
            Authorization: "Bearer " + this.getToken().accessToken
        }
    })
        .then((response) => {
            return response.json();
        })
        .catch((err) => {
            throw new Error(err);
        })
  }
}

import {decode} from 'base-64'
if (!global.atob) { global.atob = decode }

export default class AzureInstance {
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
    this.token = token;
    this.userData = JSON.parse(atob(token.accessToken.split('.')[1]));
    console.log("JsonWebToken Data: ", this.userData);
    this.userData.username = this.userData.upn.split('@')[0];
  }

  getToken() {
    return this.token;
  }

  getUserInfo() {
    if (this.token === undefined || Object.keys(this.token).length === 0) {
      throw new Error(
        "Access token is undefined, please authenticate using Auth first"
      );
    }

    return fetch("https://webservices.scientificnet.org/rest/cm/core/api/UserData/GetUserData/?domain=unibz&username=" + this.userData.username, {
      headers: {
        Authorization: "Bearer " + this.token.accessToken,
      },
    })
      .then((response) => {
        // return blob object
        return response.json();
      })
      .then((response) => {
        // read blob object back to json
        return response;
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
        Authorization: "Bearer " + this.token.accessToken,
      },
    })
        .then((response) => {
          return response.json();
        })
        .catch((err) => {
          throw new Error(err);
        })
  }
}

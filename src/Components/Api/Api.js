import axios from 'axios';
import FlashMessage from '../Screen/FlashMessage';
import { Store } from '../../Utils/Store';

const useApi = () => {

  const request = async (method, endpoint, data = {}, params = {}) => {
    try {
      const state = Store.getState();
      const token = state.initial?.token;
      
      let reqMethod = method;
      let reqHeaders = {};
      if (token) {
        reqHeaders['x-auth-token'] = token;
        reqHeaders['Authorization'] = `Bearer ${token}`;
      }
      let reqData = data;
      
      if (method === 'PUT' || method === 'DELETE') {
        reqMethod = 'POST';
        reqHeaders['X-HTTP-Method-Override'] = method;
        if (reqData && typeof reqData === 'object' && !Array.isArray(reqData)) {
          reqData = { ...reqData, _method: method };
        }
      }
      
      const response = await axios({
        method: reqMethod,
        url: endpoint,
        data: reqData,
        params,
        headers: reqHeaders,
      });
      if (response.data.message) {
        FlashMessage({
          message: response.data.message,
          type: 'success',
        });
      }
      return response.data;
    } catch (error) {
      if (error.response?.data?.message) {
        FlashMessage({
          message: error.response.data.message,
          type: 'danger',
        });
      } else {
        FlashMessage({
          message: error.message || 'Something went wrong',
          type: 'danger',
        });
      }
      console.log('useapi error', error.response?.data || error.message);
      console.log('failed request config:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      });
      throw error;
    }
  };

  const get = async (endpoint, params = {}) => {
    return request('GET', endpoint, {}, params);
  };

  const post = async (endpoint, data = {}, params = {}) => {
    return request('POST', endpoint, data, params);
  };

  const put = async (endpoint, data = {}, params = {}) => {
    return request('PUT', endpoint, data, params);
  };

  const remove = async (endpoint, params = {}) => {
    return request('DELETE', endpoint, {}, params);
  };

  return {get, post, put, remove};
};

export default useApi;

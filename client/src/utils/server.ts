import axios from "axios";

type ApiCallParameters = {
  [key: string]: any;
};

class Api {
  static get = async (
    url: string,
    parameters: ApiCallParameters
  ): Promise<any> => {
    const res = await axios.get(url, {
      params: parameters,
    });

    if (res.data.error) throw res.data.message;
    else return res.data.data;
  };

  static post = async (
    url: string,
    parameters: ApiCallParameters
  ): Promise<any> => {
    const res = await axios.post(url, parameters);

    if (res.data.error) throw res.data.message;
    else return res.data.data;
  };
}

export default Api;

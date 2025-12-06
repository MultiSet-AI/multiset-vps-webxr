import axios, { AxiosError } from 'axios';
import type {
  ILocalizeAndMapDetails,
  ILocalizeResponse,
  MapType,
  IGetMapsDetailsResponse,
  IMapSetMapsResponse,
} from './types';

export interface IMultisetSdkConfig {
  clientId: string;
  clientSecret: string;
  code: string;
  mapType: MapType;
  endpoints?: Partial<IMultisetSdkEndpoints>;
  onAuthorize?: (token: string) => void;
  onFrameCaptured?: (payload: IFrameCaptureEvent) => void;
  onCameraIntrinsics?: (intrinsics: ICameraIntrinsicsEvent) => void;
  onPoseResult?: (payload: IPoseResultEvent) => void;
  onError?: (error: unknown) => void;
}

export interface IMultisetSdkEndpoints {
  authUrl: string;
  queryUrl: string;
  mapDetailsUrl: string;
  fileDownloadUrl: string;
  mapSetDetailsUrl: string;
}

export interface IFrameCaptureEvent {
  blob: Blob;
  width: number;
  height: number;
}

export interface ICameraIntrinsicsEvent {
  fx: number;
  fy: number;
  px: number;
  py: number;
  width: number;
  height: number;
}

export interface IPoseResultEvent {
  poseFound: boolean;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  mapIds: string[];
  confidence?: number;
}

export interface ILocalizeResultEvent {
  frame: IFrameCaptureEvent;
  intrinsics: ICameraIntrinsicsEvent;
  response: ILocalizeAndMapDetails | null;
}

export const DEFAULT_ENDPOINTS: IMultisetSdkEndpoints = {
  authUrl: 'https://dev-api.multiset.ai/v1/m2m/token',
  queryUrl: 'https://dev-api.multiset.ai/v1/vps/map/query-form',
  mapDetailsUrl: 'https://dev-api.multiset.ai/v1/vps/map/',
  mapSetDetailsUrl: 'https://dev-api.multiset.ai/v1/vps/map-set/',
  fileDownloadUrl: 'https://dev-api.multiset.ai/v1/file',
};

/**
 * Placeholder class to be implemented by porting logic from multiset-webxr-sdk.
 */
export class MultisetClient {
  private readonly endpoints: IMultisetSdkEndpoints;
  private accessToken: string | null = null;

  constructor(private readonly config: IMultisetSdkConfig) {
    this.config = config;
    this.endpoints = {
      ...DEFAULT_ENDPOINTS,
      ...config.endpoints,
    };
  }

  get token(): string | null {
    return this.accessToken;
  }

  async authorize(): Promise<string> {
    try {
      const response = await axios.post(
        this.endpoints.authUrl,
        {},
        {
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret,
          },
        }
      );

      const token: string | undefined =
        response.data?.token ?? response.data?.access_token;

      if (!token) {
        throw new Error('Authorization succeeded but no token was returned.');
      }

      this.accessToken = token;
      this.config.onAuthorize?.(token);
      return token;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      this.config.onError?.(axiosError);
    } else {
      this.config.onError?.(error);
    }
  }

  async localizeWithFrame(
    frame: IFrameCaptureEvent,
    intrinsics: ICameraIntrinsicsEvent
  ): Promise<ILocalizeAndMapDetails | null> {
    if (!this.accessToken) {
      throw new Error('Access token is missing. Call authorize() first.');
    }

    this.config.onFrameCaptured?.(frame);
    this.config.onCameraIntrinsics?.(intrinsics);

    const queryResult = await this.queryLocalization(frame, intrinsics);

    if (queryResult?.localizeData?.poseFound) {
      this.config.onPoseResult?.(queryResult.localizeData);
    }

    return queryResult;
  }

  private async queryLocalization(
    frame: IFrameCaptureEvent,
    intrinsics: ICameraIntrinsicsEvent
  ): Promise<ILocalizeAndMapDetails | null> {
    const formData = new FormData();
    formData.append('isRightHanded', 'true');
    formData.append('width', `${frame.width}`);
    formData.append('height', `${frame.height}`);
    formData.append('px', `${intrinsics.px}`);
    formData.append('py', `${intrinsics.py}`);
    formData.append('fx', `${intrinsics.fx}`);
    formData.append('fy', `${intrinsics.fy}`);
    formData.append('queryImage', frame.blob);

    if (this.config.mapType === 'map') {
      formData.append('mapCode', this.config.code);
    } else {
      formData.append('mapSetCode', this.config.code);
    }

    try {
      const response = await axios.post<ILocalizeResponse>(
        this.endpoints.queryUrl,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = response.data;
      if (!data.poseFound) {
        return null;
      }

      const result: ILocalizeAndMapDetails = {
        localizeData: data,
      };

      if (data.mapIds?.length) {
        const mapDetails = await this.fetchMapDetails(data.mapIds[0]);
        if (mapDetails) {
          result.mapDetails = mapDetails;
        }
      }

      return result;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  private async fetchMapDetails(mapId: string): Promise<IGetMapsDetailsResponse | null> {
    try {
      const response = await axios.get<IGetMapsDetailsResponse>(
        `${this.endpoints.mapDetailsUrl}${mapId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  private async fetchMapSetDetails(mapSetId: string): Promise<IMapSetMapsResponse | null> {
    try {
      const response = await axios.get<IMapSetMapsResponse>(
        `${this.endpoints.mapSetDetailsUrl}${mapSetId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }
}

export type { IMultisetSdkConfig as IMultisetClientOptions };
export type {
  MapType,
  ILocalizeResponse,
  ILocalizeAndMapDetails,
  IGetMapsDetailsResponse,
  IMapSetMapsResponse,
} from './types';


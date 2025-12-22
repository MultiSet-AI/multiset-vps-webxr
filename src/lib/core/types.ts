export type MapType = 'map' | 'map-set';

export interface IPosition {
  x: number;
  y: number;
  z: number;
}

export interface IRotation {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface ILocalizeResponse {
  poseFound: boolean;
  position: IPosition;
  rotation: IRotation;
  retrieval_scores: number[];
  num_matches: number[];
  confidence: number;
  retrieved_imgs: string[];
  mapIds: string[];
}

export interface IMapLocation {
  type: string;
  coordinates: [number, number, number];
  _id: string;
}

export interface ICameraIntrinsicsResponse {
  fx: number;
  fy: number;
  px: number;
  py: number;
}

export interface IMeshInfo {
  type: string;
  meshLink: string;
}

export interface IMapMesh {
  rawMesh: IMeshInfo;
  texturedMesh: IMeshInfo;
}

export interface IResolution {
  width: number;
  height: number;
}

export interface IMapSource {
  provider: string;
  fileType: string;
  coordinateSystem: string;
}

export interface IGetMapsDetailsResponse {
  _id: string;
  accountId: string;
  mapName: string;
  location: IMapLocation;
  status: string;
  storage: number;
  createdAt: string;
  updatedAt: string;
  cameraIntrinsics: ICameraIntrinsicsResponse;
  mapMesh: IMapMesh;
  resolution: IResolution;
  globalFeature: string;
  mapCode: string;
  source: IMapSource;
}

export interface IMapSetMapData {
  _id: string;
  order: number;
  relativePose: {
    position: {
      x: number;
      y: number;
      z: number;
    },
    rotation: {
      qx: number;
      qy: number;
      qz: number;
      qw: number;
    }
  },
  createdAt: string;
  updatedAt: string;
  map: {
    _id: string;
    accountId: string;
    mapName: string;
    status: string;
    mapCode: string;
    thumbnail: string;
    storage: number;
    createdAt: string;
    updatedAt: string;
    mapMesh: {
      rawMesh: {
        type: string;
        meshLink: string;
      },
      texturedMesh: {
        type: string;
        meshLink: string;
      }
    },
    coordinates: {
      latitude: number;
      longitude: number;
      altitude: number;
    },
    offlineBundleStatus?: string;
    offlineBundle?: string;
  }
}

export interface IMapSetMapsResponse {
  mapSet: {
    _id: string;
    name: string;
    accountId: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    mapSetData: IMapSetMapData[];
  }
}

export interface ILocalizeAndMapDetails {
  localizeData: ILocalizeResponse;
  mapDetails?: IGetMapsDetailsResponse;
}


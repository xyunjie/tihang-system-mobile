/**
 * 系统用户信息
 */
export interface ISystemUserInfoVo {
   /*用户编号 */
    id: string;

    /*用户账号 */
    username: string;

    /*用户昵称 */
    nickname: string;

    /*用户邮箱 */
    email: string;

    /*手机号码 */
    mobile: string;

    /*用户性别，参见 SexEnum 枚举类 */
    sex: number;

    /*用户头像 */
    avatar: string;

    /*最后登录 IP */
    loginIp: string;

    /*最后登录时间 */
    loginDate: Record<string, unknown>;

    /*创建时间 */
    createTime: Record<string, unknown>;

    /* */
    roles: {
      /*角色编号 */
      id: number;

      /*角色名称 */
      name: string;
    }[];

    /* */
    dept: {
      /*部门编号 */
      id: number;

      /*部门名称 */
      name: string;

      /*父部门 ID */
      parentId: number;
    };

    /* */
    posts: {
      /*岗位序号 */
      id: number;

      /*岗位名称 */
      name: string;
    }[];
}

/**
 * 用户个人信息更新 Request VO
 */
export interface IUserProfileUpdateReqVO {
  /*用户邮箱 */
  email?: string;

  /*手机号码 */
  mobile?: string;

  /*角色头像 */
  avatar?: string;
}
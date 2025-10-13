/**
 * BPM 业务流程管理相关类型定义
 * 包含流程分类、流程定义等相关类型
 */

/**
 * BPM 流程分类响应 VO
 */
export interface BpmCategoryRespVO {
  /** 分类编号 */
  id: number
  /** 分类名 */
  name: string
  /** 分类标志 */
  code: string
  /** 分类描述 */
  description?: string
  /** 分类状态 */
  status?: number
  /** 分类排序 */
  sort?: number
  /** 创建时间 */
  createTime?: string
}

/**
 * 流程ID规则配置
 */
export interface ProcessIdRule {
  enable: boolean
  prefix: string
  infix: string
  postfix: string
  length: number
}

/**
 * 标题设置
 */
export interface TitleSetting {
  enable: boolean
  title: string
}

/**
 * 摘要设置
 */
export interface SummarySetting {
  enable: boolean
  summary: any[]
}

/**
 * 流程定义响应VO
 */
export interface ProcessDefinitionRespVO {
  /** 流程定义ID */
  id: string
  /** 版本号 */
  version: number
  /** 流程名称 */
  name: string
  /** 流程标识 */
  key: string
  /** 分类 */
  category: string
  /** 分类名称 */
  categoryName: string | null
  /** 模型类型 */
  modelType: number
  /** 模型ID */
  modelId: string
  /** 图标 */
  icon: string | null
  /** 描述 */
  description: string
  /** 类型 */
  type: number | null
  /** 表单类型 */
  formType: number
  /** 表单ID */
  formId: string | null
  /** 自定义创建路径 */
  formCustomCreatePath: string
  /** 自定义查看路径 */
  formCustomViewPath: string
  /** 是否可见 */
  visible: boolean
  /** 可发起用户ID列表 */
  startUserIds: string[]
  /** 可发起部门ID列表 */
  startDeptIds: string[]
  /** 管理员用户ID列表 */
  managerUserIds: string[]
  /** 排序 */
  sort: number
  /** 是否允许取消运行中的流程 */
  allowCancelRunningProcess: boolean
  /** 流程ID规则 */
  processIdRule: ProcessIdRule
  /** 自动审批类型 */
  autoApprovalType: number
  /** 标题设置 */
  titleSetting: TitleSetting
  /** 摘要设置 */
  summarySetting: SummarySetting
  /** 流程前置触发器设置 */
  processBeforeTriggerSetting: any | null
  /** 流程后置触发器设置 */
  processAfterTriggerSetting: any | null
  /** 任务前置触发器设置 */
  taskBeforeTriggerSetting: any | null
  /** 任务后置触发器设置 */
  taskAfterTriggerSetting: any | null
  /** 表单配置 */
  formConf: any | null
  /** 表单字段 */
  formFields: any | null
  /** 表单名称 */
  formName: string | null
  /** 挂起状态 */
  suspensionState: number
  /** 部署时间 */
  deploymentTime: string | null
  /** BPMN XML */
  bpmnXml: string | null
  /** 简单模型 */
  simpleModel: string
}

/**
 * 流程定义列表响应
 */
export interface CommonResultListProcessDefinitionRespVO {
  code: number
  data: ProcessDefinitionRespVO[]
  msg: string
}

/**
 * 获取流程定义详情请求参数
 */
export interface GetApprovalDetailReqVO {
  /** 流程定义的编号 */
  processDefinitionId?: string
  /** 流程变量 */
  processVariables?: Record<string, any>
  /** 流程变量字符串形式 */
  processVariablesStr?: string
  /** 流程实例的编号 */
  processInstanceId?: string
  /** 流程活动编号 */
  activityId?: string
  /** 流程任务编号 */
  taskId?: string
}

/**
 * 获取流程定义请求参数
 */
export interface GetProcessDefinitionReqVO {
  /** 流程ID */
  id?: string
  /** 流程Key */
  key?: string
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户ID */
  id: string
  /** 用户昵称 */
  nickname: string
  /** 用户头像 */
  avatar: string
  /** 部门ID */
  deptId: number
  /** 部门名称 */
  deptName: string
}

/**
 * 活动节点信息
 */
export interface ActivityNode {
  /** 节点ID */
  id: string
  /** 节点名称 */
  name: string
  /** 节点类型 */
  nodeType: number
  /** 节点状态 */
  status: number
  /** 开始时间 */
  startTime: string | null
  /** 结束时间 */
  endTime: string | null
  /** 任务列表 */
  tasks: TaskInfo[]
  /** 候选策略 */
  candidateStrategy: number | null
  /** 候选用户列表 */
  candidateUsers: CandidateUserInfo[]
  /** 流程实例ID */
  processInstanceId: string | null
  /** 多人审批时的方法 */
  approveMethod: number | null
}

export interface CandidateUserInfo {
  /* 用户编号 */
  id: number

  /* 用户昵称 */
  nickname: string

  /* 用户头像 */
  avatar: string

  /* 部门编号 */
  deptId: number

  /* 部门名称 */
  deptName: string
}

export interface TaskInfo {
  /* 任务编号 */
  id: string

  /* 任务所属人 */
  ownerUser: {
    /* 用户编号 */
    id: number

    /* 用户昵称 */
    nickname: string

    /* 用户头像 */
    avatar: string

    /* 部门编号 */
    deptId: number

    /* 部门名称 */
    deptName: string
  }

  /* 任务分配人 */
  assigneeUser: {
    /* 用户编号 */
    id: number

    /* 用户昵称 */
    nickname: string

    /* 用户头像 */
    avatar: string

    /* 部门编号 */
    deptId: number

    /* 部门名称 */
    deptName: string
  }

  /* 任务状态 */
  status: number

  /* 审批意见 */
  reason: string

  /* 签名 */
  signPicUrl: string
}

/**
 * 获取流程定义详情响应数据
 */
export interface ApprovalDetailRespVO {
  /** 状态 */
  status: number
  /** 活动节点列表 */
  activityNodes: ActivityNode[]
  /** 表单字段权限 */
  formFieldsPermission: any | null
  /** 待办任务 */
  todoTask: {
    /* 任务编号 */
    id: string

    /* 任务名字 */
    name: string

    /* 创建时间 */
    createTime: Record<string, unknown>

    /* 结束时间 */
    endTime: Record<string, unknown>

    /* 持续时间 */
    durationInMillis: number

    /* 任务状态 */
    status: number

    /* 审批理由 */
    reason: string

    /* */
    ownerUser: {
      /* 用户编号 */
      id: number

      /* 用户昵称 */
      nickname: string

      /* 用户头像 */
      avatar: string

      /* 部门编号 */
      deptId: number

      /* 部门名称 */
      deptName: string
    }

    /* */
    assigneeUser: {
      /* 用户编号 */
      id: number

      /* 用户昵称 */
      nickname: string

      /* 用户头像 */
      avatar: string

      /* 部门编号 */
      deptId: number

      /* 部门名称 */
      deptName: string
    }

    /* 任务定义的标识 */
    taskDefinitionKey: string

    /* 所属流程实例编号 */
    processInstanceId: string

    /* */
    processInstance: {
      /* 流程实例编号 */
      id: string

      /* 流程实例名称 */
      name: string

      /* 提交时间 */
      createTime: Record<string, unknown>

      /* 流程定义的编号 */
      processDefinitionId: string

      /* 流程摘要 */
      summary: Record<string, unknown>[]

      /* */
      startUser: {
        /* 用户编号 */
        id: number

        /* 用户昵称 */
        nickname: string

        /* 用户头像 */
        avatar: string

        /* 部门编号 */
        deptId: number

        /* 部门名称 */
        deptName: string
      }
    }

    /* 父任务编号 */
    parentTaskId: string

    /* 子任务列表（由加签生成） */
    children: string

    /* 表单编号 */
    formId: number

    /* 表单名字 */
    formName: string

    /* 表单的配置，JSON 字符串 */
    formConf: string

    /* 表单项的数组 */
    formFields: Record<string, unknown>[]

    /* 提交的表单值 */
    formVariables: Record<string, unknown>

    /* 操作按钮设置值 */
    buttonsSetting: {
      /* 按钮 Id */
      id: number

      /* 显示名称 */
      displayName: string

      /* 是否启用 */
      enable: boolean
    }

    /* 是否需要签名 */
    signEnable: boolean

    /* 是否填写审批意见 */
    reasonRequire: boolean

    /* 节点类型 */
    nodeType: number
  }
  /** 流程定义信息 */
  processDefinition: ProcessDefinitionRespVO

  processInstance: ProcessInstanceInfo
}

export interface ProcessInstanceInfo {
  /* 流程实例的编号 */
  id: string

  /* 流程名称 */
  name: string

  /* 流程摘要 */
  summary: {
    /* */
    key: string

    /* */
    value: string
  }[]

  /* 流程分类 */
  category: string

  /* 流程分类名称 */
  categoryName: string

  /* 流程实例的状态 */
  status: number

  /* 发起时间 */
  startTime: Record<string, unknown>

  /* 结束时间 */
  endTime: Record<string, unknown>

  /* 持续时间 */
  durationInMillis: number

  /* 提交的表单值 */
  formVariables: Record<string, unknown>

  /* 业务的唯一标识-例如说，请假申请的编号 */
  businessKey: string

  /* */
  startUser: {
    /* 用户编号 */
    id: number

    /* 用户昵称 */
    nickname: string

    /* 用户头像 */
    avatar: string

    /* 部门编号 */
    deptId: number

    /* 部门名称 */
    deptName: string
  }

  /* 流程定义的编号 */
  processDefinitionId: string

  /* */
  processDefinition: {
    /* 流程图标 */
    icon: string

    /* 流程描述 */
    description: string

    /* 流程类型 */
    type: number

    /* 表单类型 */
    formType: number

    /* 表单编号 */
    formId: number

    /* 自定义表单的提交路径，使用 Vue 的路由地址 */
    formCustomCreatePath: string

    /* 自定义表单的查看路径，使用 Vue 的路由地址 */
    formCustomViewPath: string

    /* 是否可见 */
    visible: boolean

    /* 可发起用户编号数组 */
    startUserIds: Record<string, unknown>[]

    /* 可发起部门编号数组 */
    startDeptIds: Record<string, unknown>[]

    /* 可管理用户编号数组 */
    managerUserIds: Record<string, unknown>[]

    /* 流程定义排序 */
    sort: number

    /* 允许撤销审批中的申请 */
    allowCancelRunningProcess: boolean

    /* 流程 ID 规则 */
    processIdRule: {
      /* 是否启用 */
      enable: boolean

      /* 前缀 */
      prefix: string

      /* 中缀 */
      infix: string

      /* 后缀 */
      postfix: string

      /* 序列长度 */
      length: number
    }

    /* 自动去重类型 */
    autoApprovalType: number

    /* 标题设置 */
    titleSetting: {
      /* 是否自定义 */
      enable: boolean

      /* 标题 */
      title: string
    }

    /* 摘要设置 */
    summarySetting: {
      /* 是否自定义 */
      enable: boolean

      /* 摘要字段数组 */
      summary: Record<string, unknown>[]
    }

    /* 流程前置通知设置 */
    processBeforeTriggerSetting: {
      /* 请求路径 */
      url: string

      /* 请求头参数设置 */
      header: Record<string, unknown>[]

      /* 请求头参数设置 */
      body: Record<string, unknown>[]

      /* 请求返回处理设置 */
      response: Record<string, unknown>[]
    }

    /* 流程后置通知设置 */
    processAfterTriggerSetting: {
      /* 请求路径 */
      url: string

      /* 请求头参数设置 */
      header: Record<string, unknown>[]

      /* 请求头参数设置 */
      body: Record<string, unknown>[]

      /* 请求返回处理设置 */
      response: Record<string, unknown>[]
    }

    /* 任务前置通知设置 */
    taskBeforeTriggerSetting: {
      /* 请求路径 */
      url: string

      /* 请求头参数设置 */
      header: Record<string, unknown>[]

      /* 请求头参数设置 */
      body: Record<string, unknown>[]

      /* 请求返回处理设置 */
      response: Record<string, unknown>[]
    }

    /* 任务后置通知设置 */
    taskAfterTriggerSetting: {
      /* 请求路径 */
      url: string

      /* 请求头参数设置 */
      header: Record<string, unknown>[]

      /* 请求头参数设置 */
      body: Record<string, unknown>[]

      /* 请求返回处理设置 */
      response: Record<string, unknown>[]
    }

    /* 编号 */
    id: string

    /* 版本 */
    version: number

    /* 流程名称 */
    name: string

    /* 流程标识 */
    key: string

    /* 流程分类 */
    category: string

    /* 流程分类名字 */
    categoryName: string

    /* 流程模型的类型 */
    modelType: number

    /* 流程模型的编号 */
    modelId: string

    /* 表单的配置-JSON 字符串。在表单类型为 {@link BpmModelFormTypeEnum#CUSTOM} 时，必须非空 */
    formConf: string

    /* 表单项的数组-JSON 字符串的数组。在表单类型为 {@link BpmModelFormTypeEnum#CUSTOM} 时，必须非空 */
    formFields: Record<string, unknown>[]

    /* 表单名字 */
    formName: string

    /* 中断状态-参见 SuspensionState 枚举 */
    suspensionState: number

    /* 部署时间 */
    deploymentTime: Record<string, unknown>

    /* BPMN XML */
    bpmnXml: string

    /* SIMPLE 设计器模型数据 json 格式 */
    simpleModel: string
  }

  /* */
  tasks: {
    /* 流程任务的编号 */
    id: string

    /* 任务名称 */
    name: string

    /* 任务分配人 */
    assigneeUser: {
      /* 用户编号 */
      id: number

      /* 用户昵称 */
      nickname: string

      /* 用户头像 */
      avatar: string

      /* 部门编号 */
      deptId: number

      /* 部门名称 */
      deptName: string
    }
  }[]
};

/**
 * OA 请假申请创建请求 VO
 */
export interface BpmOALeaveCreateReqVO {
  /** 请假的开始时间 */
  startTime: string
  /** 请假的结束时间 */
  endTime: string
  /** 请假类型-参见 bpm_oa_type 枚举 */
  type: number
  /** 原因 */
  reason: string
  /** 发起人自选审批人 Map */
  startUserSelectAssignees?: Record<string, number[]>
  /** 附件 */
  attachments?: string[]
}

/**
 * OA 请假申请响应 VO
 */
export interface BpmOALeaveRespVO {
  /** 请假表单主键 */
  id: number
  /** 请假类型，参见 bpm_oa_type 枚举 */
  type: number
  /** 原因 */
  reason: string
  /** 申请时间 */
  createTime: string
  /** 请假的开始时间 */
  startTime: string
  /** 请假的结束时间 */
  endTime: string
  /** 流程编号 */
  processInstanceId?: string
  /** 审批结果 */
  status: number
  /** 请假天数 */
  day?: number
  /** 附件列表 */
  attachments?: string[]
}

/**
 * 获取请假申请响应结果
 */
export interface CommonResultBpmOALeaveRespVO {
  code: number
  data: BpmOALeaveRespVO
  msg: string
}

/**
 * 管理后台 - 通过流程任务的 Request VO
 */
export interface BpmTaskApproveReqVO {
  /** 任务编号 */
  id: string
  /** 审批意见 */
  reason?: string
  /** 签名 */
  signPicUrl?: string
  /** 变量实例（动态表单） */
  variables: Record<string, any>
  /** 下一个节点审批人 */
  nextAssignees?: Record<string, number[]>
}

/**
 * 管理后台 - 不通过流程任务的 Request VO
 */
export interface BpmTaskRejectReqVO {
  /** 任务编号 */
  id: string
  /** 审批意见 */
  reason: string
}

/**
 * 管理后台 - 委派流程任务的 Request VO
 */
export interface BpmTaskDelegateReqVO {
  /** 任务编号 */
  id: string
  /** 被委派人 ID */
  delegateUserId: number
  /** 委派原因 */
  reason: string
}

/**
 * 管理后台 - 流程任务的转办 Request VO
 */
export interface BpmTaskTransferReqVO {
  /** 任务编号 */
  id: string
  /** 新审批人的用户编号 */
  assigneeUserId: number
  /** 转办原因 */
  reason: string
}

/**
 * 管理后台 - 抄送流程任务的 Request VO
 */
export interface BpmTaskCopyReqVO {
  /** 任务编号 */
  id: string
  /** 抄送的用户编号数组 */
  copyUserIds: number[]
  /** 抄送意见 */
  reason?: string
}

/**
 * 管理后台 - 加签任务的创建（加签） Request VO
 */
export interface BpmTaskSignCreateReqVO {
  /** 需要加签的任务编号 */
  id: string
  /** 加签的用户编号 */
  userIds: number[]
  /** 加签类型 */
  type: string
  /** 加签原因 */
  reason: string
}

/**
 * 管理后台 - 退回流程任务的 Request VO
 */
export interface BpmTaskReturnReqVO {
  /** 任务编号 */
  id: string
  /** 退回到的任务 Key */
  targetTaskDefinitionKey: string
  /** 退回意见 */
  reason: string
}

/**
 * 管理后台 - 流程任务 Response VO（用于退回节点列表）
 */
export interface BpmTaskReturnRespVO {
  /** 任务编号 */
  id: string
  /** 任务名字 */
  name: string
  /** 创建时间 */
  createTime: string
  /** 结束时间 */
  endTime?: string
  /** 持续时间 */
  durationInMillis?: number
  /** 任务状态 */
  status: number
  /** 审批理由 */
  reason?: string
  /** 任务拥有者 */
  ownerUser?: UserSimpleReturnVO
  /** 任务分配人 */
  assigneeUser?: UserSimpleReturnVO
  /** 任务定义的标识 */
  taskDefinitionKey: string
  /** 所属流程实例编号 */
  processInstanceId: string
  /** 流程实例 */
  processInstance?: ProcessInstanceReturn
  /** 父任务编号 */
  parentTaskId?: string
  /** 子任务列表 */
  children?: any
  /** 表单编号 */
  formId?: number
  /** 表单名字 */
  formName?: string
  /** 表单的配置 */
  formConf?: string
  /** 表单项的数组 */
  formFields?: string[]
  /** 提交的表单值 */
  formVariables?: Record<string, any>
  /** 操作按钮设置值 */
  buttonsSetting?: Record<string, OperationButtonSettingReturn>
  /** 是否需要签名 */
  signEnable?: boolean
  /** 是否填写审批意见 */
  reasonRequire?: boolean
  /** 节点类型 */
  nodeType?: number
}

/**
 * 用户精简信息 VO（用于退回节点）
 */
export interface UserSimpleReturnVO {
  /** 用户编号 */
  id: number
  /** 用户昵称 */
  nickname: string
  /** 用户头像 */
  avatar?: string
  /** 部门编号 */
  deptId: number
  /** 部门名称 */
  deptName: string
}

/**
 * 流程实例（用于退回节点）
 */
export interface ProcessInstanceReturn {
  /** 流程实例编号 */
  id: string
  /** 流程实例名称 */
  name: string
  /** 提交时间 */
  createTime: string
  /** 流程定义的编号 */
  processDefinitionId: string
  /** 流程摘要 */
  summary?: KeyValueStringStringReturn[]
  /** 发起人 */
  startUser?: UserSimpleReturnVO
}

/**
 * 键值对（用于退回节点）
 */
export interface KeyValueStringStringReturn {
  key?: string
  value?: string
}

/**
 * 操作按钮设置（用于退回节点）
 */
export interface OperationButtonSettingReturn {
  /** 按钮 ID */
  id?: number
  /** 显示名称 */
  displayName?: string
  /** 是否启用 */
  enable?: boolean
}

/**
 * 获取可退回节点列表的请求参数
 */
export interface GetTaskListByReturnReqVO {
  /** 当前任务ID */
  id: string
}

/**
 * 获取可退回节点列表的响应结果
 */
export interface CommonResultListBpmTaskRespVO {
  /** 响应码 */
  code: number
  /** 可退回节点列表 */
  data: BpmTaskRespVO[]
  /** 响应消息 */
  msg: string
}

/**
 * 通用结果 Boolean 类型
 */
export interface CommonResultBoolean {
  /** 响应码 */
  code: number
  /** 响应数据 */
  data: boolean
  /** 响应消息 */
  msg: string
}

/**
 * 通用结果 Long 类型
 */
export interface CommonResultLong {
  /** 响应码 */
  code: number
  /** 响应数据 */
  data: number
  /** 响应消息 */
  msg: string
}

/**
 * 表单字段选项
 */
export interface FormFieldOption {
  label: string
  value: any
  children?: FormFieldOption[]
}

/**
 * 树形数据节点
 */
export interface TreeNode {
  label: string
  value: any
  children?: TreeNode[]
}

/**
 * 表单字段效果配置
 */
export interface FormFieldEffect {
  fetch?: string
  [key: string]: any
}

/**
 * 表单字段属性配置
 */
export interface FormFieldProps {
  // 通用属性
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  filterable?: boolean

  // 输入框属性
  maxlength?: number
  minlength?: number
  showWordLimit?: boolean
  showPassword?: boolean

  // 数字输入框属性
  min?: number
  max?: number
  step?: number
  precision?: number

  // 文本域属性
  rows?: number
  autosize?: boolean | { minRows?: number, maxRows?: number }

  // 选择器属性
  multiple?: boolean
  multipleLimit?: number

  // 单选框/复选框属性
  options?: FormFieldOption[]

  // 开关属性
  activeText?: string
  inactiveText?: string
  activeValue?: any
  inactiveValue?: any

  // 评分属性
  allowHalf?: boolean
  showText?: boolean
  showScore?: boolean
  scoreTemplate?: string

  // 滑块属性
  range?: boolean
  showStops?: boolean
  showTooltip?: boolean
  formatTooltip?: (value: number) => string

  // 时间选择器属性
  format?: string
  valueFormat?: string
  isRange?: boolean
  rangeSeparator?: string
  startPlaceholder?: string
  endPlaceholder?: string

  // 日期选择器属性
  dateType?: string
  shortcuts?: any[]
  disabledDate?: (date: Date) => boolean

  // 级联选择器属性
  cascaderOptions?: any[]
  cascaderProps?: {
    expandTrigger?: string
    cascaderMultiple?: boolean
    checkStrictly?: boolean
    emitPath?: boolean
    lazy?: boolean
    lazyLoad?: (node: any, resolve: (data: any[]) => void) => void
    value?: string
    label?: string
    children?: string
    disabled?: string | ((data: any, node: any) => boolean)
    leaf?: string | ((data: any, node: any) => boolean)
  }

  // 穿梭框属性
  data?: any[]
  titles?: string[]
  buttonTexts?: string[]
  renderContent?: (h: any, option: any) => any
  targetOrder?: string

  // 树形控件属性
  treeData?: TreeNode[]
  treeNodeFilterProp?: string
  showCheckbox?: boolean
  treeCheckStrictly?: boolean
  defaultExpandAll?: boolean
  expandedKeys?: string[]
  checkedKeys?: string[]
  selectedKeys?: string[]

  // 文件上传属性
  action?: string
  headers?: Record<string, string>
  uploadMultiple?: boolean
  accept?: string
  limit?: number
  fileSize?: number

  // 用户选择器属性
  userType?: string
  deptIds?: number[]

  // 部门选择器属性
  deptType?: string

  // 字典选择器属性
  dictType?: string

  // 布局属性
  span?: number
  offset?: number
  push?: number
  pull?: number

  // 表格属性
  rule?: {
    row?: number
    col?: number
    style?: Record<string, any>
    class?: Record<string, any>
    layout?: any[]
  }

  // 卡片属性
  cardTitle?: string
  extra?: string
  bordered?: boolean
  hoverable?: boolean

  // 折叠面板属性
  header?: string
  key?: string
  showArrow?: boolean

  // 提示属性
  message?: string
  description?: string
  alertType?: string
  showIcon?: boolean
  closable?: boolean

  [key: string]: any
}

/**
 * 表单字段定义
 */
export interface FormField {
  /** 字段类型 */
  type: string
  /** 字段标识 */
  field?: string
  /** 模型字段 */
  modelField?: string
  /** 字段标题 */
  title?: string
  /** 字段信息/描述 */
  info?: string
  /** 是否必填 */
  $required?: string | boolean
  /** 表单控件ID */
  _fc_id?: string
  /** 字段名称引用 */
  name?: string
  /** 是否显示 */
  display?: boolean
  /** 是否隐藏 */
  hidden?: boolean
  /** 拖拽标签 */
  _fc_drag_tag?: string
  /** 字段值 */
  value?: any
  /** 插槽位置 */
  slot?: string

  /** 字段属性配置 */
  props?: FormFieldProps
  /** 字段效果配置 */
  effect?: FormFieldEffect
  /** 子字段（用于布局组件） */
  children?: FormField[]
  /** 样式配置 */
  style?: Record<string, any>
  /** CSS类配置 */
  class?: Record<string, any>

  // 兼容旧格式
  /** 字段占位符 (兼容) */
  placeholder?: string
  /** 是否禁用 (兼容) */
  disabled?: boolean
  /** 最大长度 (兼容) */
  maxlength?: number
  /** 最小值 (兼容) */
  min?: number
  /** 最大值 (兼容) */
  max?: number
  /** 文本域行数 (兼容) */
  rows?: number
  /** 选项列表 (兼容) */
  options?: Array<{ label: string, value: any }>
  /** 字段标签 (兼容) */
  label?: string
  /** 字段标签 (兼容) */
  tag?: string
  /** 是否必填 (兼容) */
  required?: boolean
  /** 验证规则 */
  validate?: {
    transform?: string
    mode?: string
    trigger?: string
    len?: number
    message?: string
  }[]
}

/**
 * BPM 自定义表单创建请求 VO
 */
export interface BpmCustomFormCreateReqVO {
  /** 流程定义ID */
  processDefinitionId: string
  /** 表单变量 */
  variables: Record<string, any>
  /** 开始用户选择的审批人 */
  startUserSelectAssignees?: Record<string, number[]>
}

/**
 * BPM 任务统计响应 VO
 */
export interface BpmTaskStatisticsRespVO {
  /** 待办数量 */
  pendingCount: number
  /** 已办数量 */
  completedCount: number
  /** 抄送数量 */
  ccCount: number
  /** 今日新增数量 */
  todayCount: number
}

/**
 * 通用结果包装 - BPM 任务统计
 */
export interface CommonResultBpmTaskStatisticsRespVO {
  /** 状态码 */
  code: number
  /** 数据 */
  data: BpmTaskStatisticsRespVO
  /** 消息 */
  msg: string
}

/**
 * 用户简单信息
 */
export interface UserSimpleBaseVO {
  /** 用户ID */
  id: number
  /** 用户昵称 */
  nickname: string
  /** 用户头像 */
  avatar: string
  /** 部门ID */
  deptId: number
  /** 部门名称 */
  deptName: string
}

/**
 * 流程实例简单信息
 */
export interface ProcessInstanceSimpleVO {
  /** 流程实例ID */
  id: string
  /** 流程实例名称 */
  name: string
  /** 创建时间 */
  createTime: string
  createUser: UserSimpleBaseVO
  /** 流程定义ID */
  processDefinitionId: string
  processInstanceName: string
  /** 活动ID */
  activityId: string
  processInstanceId: string
  /** 摘要信息 */
  summary: Array<{ key: string, value: string }>
  /** 发起人信息 */
  startUser: UserSimpleBaseVO
}

/**
 * BPM 任务响应 VO
 */
export interface BpmTaskRespVO {
  /** 任务编号 */
  id: string
  /** 任务名字 */
  name: string
  /** 创建时间 */
  createTime: string
  /** 结束时间 */
  endTime?: string
  /** 持续时间（毫秒） */
  durationInMillis?: number
  /** 任务状态 */
  status: number
  /** 审批理由 */
  reason?: string
  /** 拥有者用户 */
  ownerUser?: UserSimpleBaseVO
  /** 分配用户 */
  assigneeUser?: UserSimpleBaseVO
  /** 任务定义Key */
  taskDefinitionKey: string
  /** 流程实例ID */
  processInstanceId: string
  /** 流程实例信息 */
  processInstance: ProcessInstanceSimpleVO
  /** 父任务ID */
  parentTaskId?: string
  /** 子任务 */
  children?: string
  /** 表单ID */
  formId?: number
  /** 表单名称 */
  formName?: string
  /** 表单配置 */
  formConf?: string
  /** 表单字段 */
  formFields?: Record<string, any>[]
  /** 表单变量 */
  formVariables?: Record<string, any>
  /** 按钮设置 */
  buttonsSetting?: Array<{
    id: number
    displayName: string
    enable: boolean
  }>
  /** 是否启用签名 */
  signEnable?: boolean
  /** 是否必填理由 */
  reasonRequire?: boolean
  /** 节点类型 */
  nodeType?: number
}

/**
 * 分页结果 - BPM 任务
 */
export interface PageResultBpmTaskRespVO {
  /** 数据列表 */
  list: BpmTaskRespVO[]
  /** 总数量 */
  total: number
}

/**
 * 通用结果包装 - 分页 BPM 任务
 */
export interface CommonResultPageResultBpmTaskRespVO {
  /** 状态码 */
  code: number
  /** 数据 */
  data: PageResultBpmTaskRespVO
  /** 消息 */
  msg: string
}

/**
 * 获取待办任务分页请求参数
 */
export interface GetTaskTodoPageReqVO {
  /** 流程任务名 */
  name?: string
  /** 流程分类 */
  category?: string
  /** 流程定义的标识 */
  processDefinitionKey?: string
  /** 创建时间范围 */
  createTime?: string[]
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
}

/**
 * 获取已办任务分页请求参数
 */
export interface GetTaskDonePageReqVO {
  /** 流程任务名 */
  name?: string
  /** 流程分类 */
  category?: string
  /** 流程定义的标识 */
  processDefinitionKey?: string
  /** 创建时间范围 */
  createTime?: string[]
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
}

/**
 * 获取抄送列表分页请求参数
 */
export interface GetProcessInstanceCopyPageReqVO {
  /** 流程实例名 */
  name?: string
  /** 流程分类 */
  category?: string
  /** 流程定义的标识 */
  processDefinitionKey?: string
  /** 创建时间范围 */
  createTime?: string[]
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
}

/**
 * 获取我的审批列表分页请求参数
 */
export interface GetProcessInstanceMyPageReqVO {
  /** 流程实例名 */
  name?: string
  /** 流程分类 */
  category?: string
  /** 流程定义的标识 */
  processDefinitionKey?: string
  /** 创建时间范围 */
  createTime?: string[]
  /** 页码，从 1 开始 */
  pageNo: number
  /** 每页条数，最大值为 100 */
  pageSize: number
}

/**
 * 我的审批流程实例响应 VO
 */
export interface BpmProcessInstanceMyRespVO {
  /** 流程实例编号 */
  id: string
  /** 流程实例名称 */
  name: string
  /** 流程摘要 */
  summary?: Array<{
    key: string | null
    value: string
  }>
  /** 分类 */
  category: string
  /** 分类名称 */
  categoryName: string
  /** 流程状态 */
  status: number
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 持续时间（毫秒） */
  durationInMillis?: number
  /** 表单变量 */
  formVariables?: Record<string, any>
  /** 业务键 */
  businessKey?: string | null
  /** 发起人信息 */
  startUser?: UserSimpleBaseVO
  /** 流程定义ID */
  processDefinitionId: string
  /** 流程定义信息 */
  processDefinition?: {
    icon?: string | null
    description?: string | null
    type?: number | null
    formType?: number | null
    formId?: number | null
    formCustomCreatePath?: string | null
    formCustomViewPath?: string | null
    visible?: boolean | null
    startUserIds?: any[] | null
    startDeptIds?: any[] | null
    managerUserIds?: any[] | null
    sort?: number | null
    allowCancelRunningProcess?: boolean | null
    processIdRule?: any | null
    autoApprovalType?: number | null
    titleSetting?: any | null
    summarySetting?: any | null
    processBeforeTriggerSetting?: any | null
    processAfterTriggerSetting?: any | null
    taskBeforeTriggerSetting?: any | null
    taskAfterTriggerSetting?: any | null
    id: string
    version: number
    name: string
    key: string
    category: string
    categoryName?: string | null
    modelType?: number | null
    modelId?: string | null
    formConf?: string | null
    formFields?: any[] | null
    formName?: string | null
    suspensionState: number
    deploymentTime?: any | null
    bpmnXml?: string | null
    simpleModel?: string | null
  }
  /** 任务列表 */
  tasks?: any[] | null
}

/**
 * 分页结果 - 我的审批
 */
export interface PageResultBpmProcessInstanceMyRespVO {
  /** 数据列表 */
  list: BpmProcessInstanceMyRespVO[]
  /** 总数量 */
  total: number
}

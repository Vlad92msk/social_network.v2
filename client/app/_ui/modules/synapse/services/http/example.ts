import { BaseHttpClient } from './BaseHttpClient'
import { ContentType, ModuleApiConfig, ObservedValuePromise, RequestParams } from './types'

export class CoreApi extends BaseHttpClient {
  private readonly xMesSubsystem: string

  constructor(config: ModuleApiConfig) {
    super(
      {
        baseUrl: config?.main?.baseUrl || 'school.mos.ru/api/ej/core/teacher/v1',
        storage: config?.main?.storage || {
          dbName: 'mes-api',
          storeName: 'core',
          dbVersion: 1,
        }
      },
      {
        cache: config.cache,
      }
    );
    this.xMesSubsystem = config.main.xMesSubsystem;
  }


  /**
   * @description Создает новую попытку ликвидации академической задолженности
   *
   * @tags academic-debt-attempt-controller
   * @name postAcademicDebtAttempt
   * @originalRouteName createUsingPost
   * @summary Создать попытку
   * @request POST:/academic_debt_attempt
   * @requestContentType application/json
   * @response `200` `IAcademicDebtAttempt` Успешно создано
   * @response `201` `void` Created
   * @response `400` `void` Некорректные данные
   * @response `401` `void` Unauthorized
   * @response `403` `void` Недостаточно прав
   * @response `404` `void` Not Found
   */
  postAcademicDebtAttempt = (
    data: IAcademicDebtAttempt,
    requestParams: RequestParams = {},
  ): ObservedValuePromise<IAcademicDebtAttempt, void> =>
    from(
      this.request<IAcademicDebtAttempt, void>({
        path: `/academic_debt_attempt`,
        apiPathKey: `corePath`,
        method: "POST",
        xMesSubsystem: this.xMesSubsystem,
        body: data,
        type: ContentType.Json,
        ...requestParams,
      }),
    );

  getAcademicDebtAttemptByAcademicDebtAttemptId = (
    academicDebtAttemptId: number,
    data: IAcademicDebtAttempt,
    requestParams: RequestParams = {},
  ): ObservedValuePromise<IAcademicDebtAttempt, void> =>
    from(
      this.request<IAcademicDebtAttempt, void>({
        path: `/academic_debt_attempt/${academicDebtAttemptId}`,
        apiPathKey: `corePath`,
        method: "GET",
        xMesSubsystem: this.xMesSubsystem,
        methodPublicName: 'getAcademicDebtAttemptByAcademicDebtAttemptId',
        body: data,
        ...requestParams,
      }),
    );

  //...
}

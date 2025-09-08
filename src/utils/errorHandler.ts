// 통합 에러 핸들링 유틸리티

export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): AppError {
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    let errorCode = 'UNKNOWN_ERROR';
    let errorDetails: any = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
      
      // Supabase 관련 에러 처리
      if (error.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.message.includes('Supabase')) {
        errorCode = 'DATABASE_ERROR';
        errorMessage = '데이터베이스 연결에 문제가 있습니다.';
      } else if (error.message.includes('환경 변수')) {
        errorCode = 'CONFIG_ERROR';
        errorMessage = '환경 설정에 문제가 있습니다.';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    const appError: AppError = {
      message: context ? `${context}: ${errorMessage}` : errorMessage,
      code: errorCode,
      details: errorDetails
    };

    // 개발 환경에서만 상세 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', appError);
    }

    return appError;
  }

  static logError(error: AppError, context?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      ...error
    };

    console.error('Application Error:', logEntry);
    
    // 실제 운영환경에서는 에러 로깅 서비스로 전송
    // 예: Sentry, LogRocket 등
  }
}

// 토스트 알림을 위한 간단한 알림 시스템
export class NotificationService {
  private static notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: number;
  }> = [];

  private static listeners: Array<(notifications: typeof NotificationService.notifications) => void> = [];

  static show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now()
    };

    this.notifications.push(notification);
    this.notifyListeners();

    // 자동으로 5초 후 제거
    setTimeout(() => {
      this.remove(notification.id);
    }, 5000);
  }

  static remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  static subscribe(listener: (notifications: typeof NotificationService.notifications) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  static success(message: string): void {
    this.show(message, 'success');
  }

  static error(message: string): void {
    this.show(message, 'error');
  }

  static warning(message: string): void {
    this.show(message, 'warning');
  }
}
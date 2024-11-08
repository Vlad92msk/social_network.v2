// Сервис настроек приложения
export class SettingsService {
  private settings: Map<string, any> = new Map()

  setSetting(key: string, value: any) {
    this.settings.set(key, value)
    // Сохранение в localStorage для персистентности
    localStorage.setItem('app_settings', JSON.stringify(Object.fromEntries(this.settings)))
  }

  getSetting(key: string): any {
    return this.settings.get(key)
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('app_settings')
    if (savedSettings) {
      this.settings = new Map(Object.entries(JSON.parse(savedSettings)))
    }
  }
}

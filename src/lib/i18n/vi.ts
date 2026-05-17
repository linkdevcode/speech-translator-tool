/** Chuỗi giao diện tiếng Việt */
export const vi = {
  meta: {
    title: "Phiên dịch giọng nói",
    description: "Dịch giọng nói hai chiều theo thời gian thực",
  },
  app: {
    title: "Phiên dịch giọng nói",
    loading: "Đang tải…",
    subtitleClassic: "Nói, dịch và nghe kết quả trong khung chat trực tiếp.",
    subtitleInterpreter: (a: string, b: string) => `Hội thoại: ${a} ↔ ${b}`,
  },
  mode: {
    label: "Chế độ dịch",
    classic: "Cổ điển",
    interpreter: "Phiên dịch",
  },
  language: {
    from: "Nguồn",
    to: "Đích",
    languageA: "Ngôn ngữ A",
    languageB: "Ngôn ngữ B",
    swap: "Đổi ngôn ngữ",
    swapPair: "Đổi cặp ngôn ngữ",
    pickerLabel: (label: string) => `Ngôn ngữ ${label}`,
    closeMenu: "Đóng danh sách ngôn ngữ",
  },
  live: {
    labelClassic: (lang: string) => `Trực tiếp · ${lang}`,
    labelInterpreter: (lang: string) => `Trực tiếp · đang nghe ${lang}`,
    placeholderClassic: (lang: string) =>
      `Bấm mic để bắt đầu, nói ${lang}, bấm lại để dịch…`,
    placeholderInterpreter: (a: string, b: string) =>
      `Bấm mic, nói ${a} hoặc ${b}, bấm lại để phiên dịch…`,
    clear: "Xóa",
  },
  conversation: {
    title: "Hội thoại",
    emptyClassic:
      "Hội thoại hiển thị dạng bong bóng chat — bản gốc bên phải, bản dịch bên trái.",
    emptyInterpreter:
      "Nói một trong hai ngôn ngữ — mỗi lượt sẽ được nhận diện và dịch tự động.",
    failed: "Dịch thất bại.",
    ariaMessages: "Tin nhắn hội thoại",
  },
  status: {
    idle: "Bấm mic để bắt đầu",
    listening: "Đang ghi âm… Bấm mic khi xong",
    processing: "Đang dịch…",
    speaking: "Đang phát bản dịch…",
  },
  mic: {
    start: "Bắt đầu nghe",
    stop: "Dừng nghe",
    listeningFor: "Đang nghe:",
  },
  playback: {
    play: "Phát bản dịch",
    stop: "Dừng phát",
    playFailed: "Không thể phát âm thanh cho tin nhắn này.",
    translatedAudioFailed: "Không thể phát âm thanh bản dịch.",
  },
  toast: {
    dismiss: "Đóng thông báo",
    unsupportedBrowser:
      "Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng dùng Google Chrome, Microsoft Edge hoặc Safari.",
    swapFailed: "Không thể đổi ngôn ngữ. Vui lòng thử lại.",
    clearFailed: "Không thể xóa hội thoại.",
    micFailed: "Không thể bật micro. Vui lòng thử lại.",
    retryIn: (seconds: number) =>
      `Hệ thống đang bận, thử lại sau ${seconds} giây…`,
  },
  unsupported: {
    title: "Trình duyệt không được hỗ trợ",
    body: "Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng dùng Google Chrome, Microsoft Edge hoặc Safari.",
  },
  errors: {
    rateLimit:
      "Đã đạt giới hạn tần suất API. Vui lòng đợi một lúc rồi thử lại.",
    rateLimitGemini:
      "Đã đạt giới hạn Gemini (15 lượt/phút). Vui lòng đợi rồi thử lại.",
    rateLimitAll:
      "Đã đạt giới hạn tần suất trên mọi nhà cung cấp. Vui lòng đợi rồi thử lại.",
    network:
      "Lỗi mạng khi dịch. Kiểm tra kết nối và thử lại.",
    networkInterpreter:
      "Lỗi mạng khi phiên dịch. Kiểm tra kết nối và thử lại.",
    streamUnsupported: "Trình duyệt không hỗ trợ dịch dạng stream.",
    emptyTranslation: "Không nhận được bản dịch.",
    parseTranslation:
      "Không đọc được bản dịch từ phản hồi. Vui lòng thử lại.",
    parseInterpreter:
      "Không đọc được kết quả phiên dịch. Vui lòng thử lại.",
    translationFailed: "Không thể hoàn tất bản dịch.",
    interpreterFailed: "Không thể hoàn tất phiên dịch.",
    translationGeneric: "Dịch thất bại",
    interpreterGeneric: "Phiên dịch thất bại",
    playbackStart: "Không thể bắt đầu phát âm thanh.",
    neuralPlayback: "Không thể phát giọng nói.",
    sttProcess: "Không thể xử lý kết quả nhận diện giọng nói.",
    micDenied:
      "Quyền micro bị từ chối. Vui lòng cho phép truy cập và thử lại.",
    sttError: (code: string) => `Lỗi nhận diện giọng nói: ${code}`,
    sttUnexpected: "Lỗi không mong đợi khi nhận diện giọng nói.",
    sttUnsupported: "Trình duyệt không hỗ trợ nhận diện giọng nói.",
    micStart: "Không thể bật micro. Vui lòng thử lại.",
  },
} as const;

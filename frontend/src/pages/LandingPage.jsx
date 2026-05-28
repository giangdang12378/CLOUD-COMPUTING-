import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CoverflowSwiper from "../components/CoverflowSwiper";
import {
  ShoppingBag,
  Star,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Heart,
  Award,
  User,
  LayoutDashboard,
  BarChart3,
  Store,
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Quản lý kho dễ dàng",
      description:
        "Theo dõi hàng tồn kho theo thời gian thực, quản lý biến thể sản phẩm (màu sắc, kích thước) một cách trực quan.",
      bgImage:
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop",
    },
    {
      icon: Zap,
      title: "Xử lý đơn hàng nhanh",
      description:
        "Hệ thống POS tối ưu giúp nhân viên tạo đơn và thanh toán chỉ trong vài giây, giảm thiểu thời gian chờ đợi.",
      bgImage:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop",
    },
    {
      icon: BarChart3,
      title: "Báo cáo chuyên sâu",
      description:
        "Phân tích doanh thu, lợi nhuận và hiệu suất bán hàng thông qua các biểu đồ trực quan, sinh động.",
      bgImage:
        "https://images.unsplash.com/photo-1521335629791-ce4aec67dd15?q=80&w=2070&auto=format&fit=crop",
    },
    {
      icon: Award,
      title: "Giải pháp SaaS tối ưu",
      description:
        "Hoạt động trên nền tảng đám mây, truy cập dữ liệu cửa hàng mọi lúc mọi nơi trên mọi thiết bị.",
      bgImage:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  const testimonials = [
    {
      name: "Nguyễn Minh Anh",
      role: "Chủ cửa hàng Fashionista",
      content:
        "StyleZone giúp tôi quản lý hàng tồn kho cực kỳ chính xác. Từ khi dùng hệ thống, tôi không còn lo lắng về việc thất thoát hàng hóa nữa.",
      rating: 5,
    },
    {
      name: "Trần Văn Nam",
      role: "Quản lý chuỗi cửa hàng",
      content:
        "Hệ thống POS rất dễ sử dụng, nhân viên mới chỉ mất 15 phút là có thể làm quen. Báo cáo doanh thu rất chi tiết và dễ hiểu.",
      rating: 5,
    },
    {
      name: "Lê Thị Hoa",
      role: "Chủ thương hiệu Local Brand",
      content:
        "Việc mở rộng thêm chi nhánh trở nên đơn giản hơn rất nhiều với mô hình SaaS của StyleZone. Tôi có thể quản lý tất cả cửa hàng từ xa.",
      rating: 5,
    },
  ];

  const stats = [
    { number: "500+", label: "Cửa hàng đang sử dụng" },
    { number: "1M+", label: "Giao dịch mỗi tháng" },
    { number: "24/7", label: "Hỗ trợ kỹ thuật" },
    { number: "99.9%", label: "Thời gian hoạt động" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-8 h-8 text-green-700" />
              <span className="text-2xl font-bold text-gray-900">StyleZone </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 px-4 py-2 rounded-lg font-semibold hover:text-green-700 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register-store"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all"
              >
                Mở Cửa Hàng
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop')",
          }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center z-10">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Giải pháp quản lý cửa hàng thời trang
                <span className="text-green-700"> Toàn diện </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Tối ưu hóa vận hành, quản lý kho bãi và thúc đẩy doanh số với hệ thống quản lý bán hàng chuyên nghiệp dành riêng cho thời trang.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register-store"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl leading-snug hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  Bắt đầu ngay
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                >
                  Đăng nhập hệ thống
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-green-50 rounded-3xl p-8 text-gray-900 border border-green-100 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Store className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">Ưu đãi doanh nghiệp!</h3>
                <p className="text-lg text-gray-700 mb-6">
                  Miễn phí 3 tháng sử dụng dịch vụ khi đăng ký mở cửa hàng mới trong tháng này.
                </p>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Áp dụng cho mọi quy mô cửa hàng</span>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-200/20 rounded-full"></div>
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-green-200/10 rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-8 w-36 h-36 flex items-center justify-center mx-auto ">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#16a34a" strokeWidth="8" fill="none" className="opacity-10" />
                    <circle cx="50" cy="50" r="45" stroke="#16a34a" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset="70" />
                  </svg>
                  <span className="absolute text-3xl font-bold text-green-700">
                    {stat.number}
                  </span>
                </div>
                <div className="text-gray-700 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-[500px]">
            <CoverflowSwiper />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              TẠI SAO CHỌN STYLEZONE?
            </h2>
            <p className="text-xl mt-4 text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp hệ thống quản lý chuyên sâu giúp các doanh nghiệp thời trang vận hành thông minh và hiệu quả hơn.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-2"
                style={{
                  backgroundImage: `url(${feature.bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>
                <div className="relative z-10 p-8 flex flex-col items-start text-left">
                  <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/90 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cộng đồng chủ cửa hàng tin dùng
            </h2>
            <p className="text-xl text-gray-600">
              Hàng trăm doanh nghiệp đã số hóa quy trình quản lý cùng StyleZone
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-green-700">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Bắt đầu hành trình số hóa ngay hôm nay
            </h2>
            <p className="text-xl text-white mb-8 leading-relaxed">
              Gia nhập cộng đồng StyleZone để tối ưu hóa quy trình bán hàng và quản trị cửa hàng của bạn một cách chuyên nghiệp nhất.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register-store"
                className="bg-white text-green-700 px-8 py-4 rounded-xl text-lg font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Store className="w-5 h-5" />
                Mở cửa hàng ngay
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingBag className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold">StyleZone</span>
              </div>
              <p className="text-gray-400 mb-4">
                Giải pháp quản lý bán hàng (POS) hiện đại cho ngành thời trang, giúp bạn vận hành kinh doanh thông minh và hiệu quả hơn.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Sản phẩm</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register-store" className="hover:text-white transition-colors">Đăng ký cửa hàng</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Hệ thống POS</Link></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Quản lý kho</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Báo cáo & Phân tích</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-gray-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">Tài liệu hướng dẫn</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Trung tâm hỗ trợ</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Câu hỏi thường gặp</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Liên hệ hợp tác</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Kết nối</h3>
              <p className="text-gray-400 mb-4">
                Theo dõi chúng tôi để cập nhật các tính năng mới nhất và kiến thức quản trị kinh doanh.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                  <span className="text-sm font-semibold">f</span>
                </div>
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors">
                  <span className="text-sm font-semibold">in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StyleZone POS. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

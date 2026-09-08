'use client'

import { MapPin, Calendar, Clock, Phone, FileText, Info } from 'lucide-react'
import { formatDateVN } from '@/lib/date'

export interface CheckInInstructionsProps {
    roomName: string
    lotName: string
    lotRegion: string
    lotDescription: string
    checkInDate: string
    checkOutDate: string
    guestPhone: string
    specialRequests?: string | null
}

export default function CheckInInstructions({
    roomName,
    lotName,
    lotRegion,
    lotDescription,
    checkInDate,
    checkOutDate,
    guestPhone,
    specialRequests,
}: CheckInInstructionsProps) {
    const formattedCheckIn = formatDateVN(checkInDate)
    const formattedCheckOut = formatDateVN(checkOutDate)

    return (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-emerald-200/80 pb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-emerald-950">Hướng dẫn nhận phòng</h3>
                    <p className="text-xs text-emerald-700">Thông tin chi tiết dành cho kỳ nghỉ của bạn</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Garden and Room details */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-2.5">
                        <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm đến</p>
                            <p className="text-sm font-bold text-gray-900">{lotName}</p>
                            {lotRegion && (
                                <p className="text-xs text-emerald-700 font-medium">{lotRegion}</p>
                            )}
                            {lotDescription && (
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{lotDescription}</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-start gap-2.5">
                        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phòng đặt</p>
                            <p className="text-sm font-semibold text-gray-900">{roomName}</p>
                        </div>
                    </div>
                </div>

                {/* Times and Contact */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-2.5">
                        <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thời gian lưu trú</p>
                            <p className="text-sm text-gray-800">
                                Nhận phòng: <span className="font-semibold text-gray-900">{formattedCheckIn}</span>
                            </p>
                            <p className="text-sm text-gray-800">
                                Trả phòng: <span className="font-semibold text-gray-900">{formattedCheckOut}</span>
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-start gap-2.5">
                        <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quy định giờ giấc</p>
                            <p className="text-xs text-gray-600">Nhận phòng từ 14:00 - Trả phòng trước 12:00</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-start gap-2.5">
                        <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hotline lễ tân & hỗ trợ</p>
                            <p className="text-sm font-semibold text-emerald-700">1900 8888</p>
                            {guestPhone && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    SĐT liên hệ khách: <span className="font-medium text-gray-700">{guestPhone}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Special requests if any */}
            {specialRequests && (
                <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Yêu cầu đặc biệt đã ghi nhận</p>
                        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{specialRequests}</p>
                    </div>
                </div>
            )}

            {/* General notes */}
            <div className="bg-emerald-100/50 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed space-y-1">
                <p className="font-semibold">Lưu ý khi nhận phòng:</p>
                <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                    <li>Vui lòng mang theo CMND/CCCD hoặc Hộ chiếu của người đại diện nhận phòng.</li>
                    <li>Nếu quý khách dự kiến đến sau 18:00, vui lòng liên hệ trước với ban quản lý vườn.</li>
                </ul>
            </div>
        </div>
    )
}

export { CheckInInstructions }

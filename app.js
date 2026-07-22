// Client-side data engine for Project 4 Github Pages
// ========================
// IndexedDB Helper
// ========================
const DB_NAME = 'WaterDataDB';
const STORE_NAME = 'WaterDataStore';
const DB_VERSION = 1;

window.dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };
});

window.saveToIDB = async function(data) {
    try {
        const db = await window.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(data, 'allData');
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error("Lỗi khi lưu vào IndexedDB:", err);
    }
};

window.loadFromIDB = async function() {
    try {
        const db = await window.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('allData');
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error("Lỗi khi tải từ IndexedDB:", err);
        return null;
    }
};

window.clearIDB = async function() {
    try {
        const db = await window.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error("Lỗi khi xóa IndexedDB:", err);
    }
};

// Helper utilities for data parsing
function getRowVal(r, keys) {
    for (let k of keys) {
        if (r[k] !== undefined && r[k] !== null && r[k] !== "") {
            return r[k];
        }
    }
    return undefined;
}

function parseNum(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = val.toString().trim().replace(/,/g, '');
    let n = parseFloat(str);
    return isNaN(n) ? 0 : n;
}

function parseIntNum(val) {
    let n = parseNum(val);
    return Math.round(n);
}

function extractYearAndMonthFromPath(pathOrName) {
    let year = 0;
    let month = 0;

    const normalized = pathOrName.replace(/\\/g, '/');

    // Extract 4-digit year from directory path or filename (e.g. 2025/01.xlsb -> 2025)
    const yearMatch = normalized.match(/(?:^|\/)(20\d\d)(?:\/|_|-|\b)/);
    if (yearMatch) {
        year = parseInt(yearMatch[1]);
    } else {
        const anyYear = normalized.match(/\b(20\d\d)\b/);
        if (anyYear) year = parseInt(anyYear[1]);
    }

    // Extract month from filename (e.g. 01.xlsb, 1.xlsx)
    const filename = normalized.split('/').pop();
    const monthMatch = filename.match(/(?:^|[^\d])(\d{1,2})\.(?:xls|xlsx|xlsb)$/i);
    if (monthMatch) {
        let m = parseInt(monthMatch[1]);
        if (m >= 1 && m <= 12) month = m;
    }

    return { year, month };
}

function mapExcelRow(r, defaultNam = 0, defaultThang = 0) {
    let donViRaw = getRowVal(r, ['donVi', 'Đơn vị', 'donvi', 'ĐƠN VỊ', 'ĐV']) || "";
    let maKH = getRowVal(r, ['maKhachHang', 'Mã khách hàng', 'Mã KH', 'MA_KH', 'makhachhang']) || "";
    let tenKH = getRowVal(r, ['tenKhachHang', 'Tên khách hàng', 'Tên KH', 'TEN_KH', 'tenkhachhang']) || "";
    
    let nam = parseIntNum(getRowVal(r, ['nam', 'Năm', 'NAM']));
    if (!nam || nam === 0) nam = defaultNam;

    let thang = parseIntNum(getRowVal(r, ['thang', 'Tháng', 'THANG']));
    if (!thang || thang === 0) thang = defaultThang;

    let maTuyen = getRowVal(r, ['maTuyenDoc', 'Mã tuyến đọc', 'Mã tuyến', 'Tuyến đọc', 'matuyendoc']) || "";
    let maPhamVi = getRowVal(r, ['maPhamVi', 'Mã phạm vi', 'Phạm vi', 'maphamvi']) || "";
    let mucDich = getRowVal(r, ['mucDich', 'Mục đích SD', 'Mục đích sử dụng', 'Mục đích', 'mucdich']) || "";
    let maDoiTuongGia = getRowVal(r, ['maDoiTuongGia', 'Mã đối tượng giá', 'Đối tượng giá', 'Mức giá', 'madoituonggia']) || "";
    
    let tieuThu = parseNum(getRowVal(r, ['tieuThu', 'Tiêu thụ', 'Sản lượng', 'SL', 'tieuthu']));
    let thanhTien = parseNum(getRowVal(r, ['thanhTien', 'Thành tiền', 'Thành Tiền', 'thanhtien']));
    let phiVAT = parseNum(getRowVal(r, ['phiVAT', 'Phí VAT', 'VAT', 'phivat']));
    let phiBVMT = parseNum(getRowVal(r, ['phiBVMT', 'Phí BVMT', 'BVMT', 'Phí bảo vệ môi trường', 'phibvmt']));
    let tongTien = parseNum(getRowVal(r, ['tongTien', 'Tổng tiền', 'Tổng cộng', 'TongTien', 'tongtien']));
    
    if (tongTien === 0 && (thanhTien > 0 || phiVAT > 0 || phiBVMT > 0)) {
        tongTien = thanhTien + phiVAT + phiBVMT;
    }

    return {
        donVi: donViRaw.toString().trim().toUpperCase(),
        maKhachHang: maKH.toString().trim(),
        tenKhachHang: tenKH.toString().trim(),
        nam,
        thang,
        maTuyenDoc: maTuyen.toString().trim(),
        maPhamVi: maPhamVi.toString().trim(),
        mucDich: mucDich.toString().trim(),
        maDoiTuongGia: maDoiTuongGia.toString().trim(),
        tieuThu,
        thanhTien,
        phiVAT,
        phiBVMT,
        tongTien
    };
}

// ========================
// Global Data Container
// ========================
window.allData = [];

function getUniqueValues(data, field) {
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
        if (data[i][field]) set.add(data[i][field]);
    }
    return Array.from(set).sort();
}

window.mockApiFilters = function(payload) {
    let filtered = window.allData;
    if (payload.donVi && payload.donVi.length) filtered = filtered.filter(r => payload.donVi.includes(r.donVi));
    if (payload.maTuyenDoc && payload.maTuyenDoc.length) filtered = filtered.filter(r => payload.maTuyenDoc.includes(r.maTuyenDoc));
    if (payload.maPhamVi && payload.maPhamVi.length) filtered = filtered.filter(r => payload.maPhamVi.includes(r.maPhamVi));
    if (payload.mucDich && payload.mucDich.length) filtered = filtered.filter(r => payload.mucDich.includes(r.mucDich));
    if (payload.maDoiTuongGia && payload.maDoiTuongGia.length) filtered = filtered.filter(r => payload.maDoiTuongGia.includes(r.maDoiTuongGia));
    if (payload.nam && payload.nam.length) filtered = filtered.filter(r => payload.nam.includes(r.nam));
    if (payload.thang && payload.thang.length) filtered = filtered.filter(r => payload.thang.includes(r.thang));

    return {
        donVi: getUniqueValues(filtered, 'donVi'),
        maTuyenDoc: getUniqueValues(filtered, 'maTuyenDoc'),
        maPhamVi: getUniqueValues(filtered, 'maPhamVi'),
        mucDich: getUniqueValues(filtered, 'mucDich'),
        maDoiTuongGia: getUniqueValues(filtered, 'maDoiTuongGia'),
        nam: getUniqueValues(filtered, 'nam').sort((a,b)=>b-a),
        thang: getUniqueValues(filtered, 'thang').sort((a,b)=>a-b)
    };
};

window.mockApiQuery = function(payload) {
    let df = window.allData;
    
    if (payload.donVi && payload.donVi.length) df = df.filter(r => payload.donVi.includes(r.donVi));
    if (payload.maTuyenDoc && payload.maTuyenDoc.length) df = df.filter(r => payload.maTuyenDoc.includes(r.maTuyenDoc));
    if (payload.maPhamVi && payload.maPhamVi.length) df = df.filter(r => payload.maPhamVi.includes(r.maPhamVi));
    if (payload.mucDich && payload.mucDich.length) df = df.filter(r => payload.mucDich.includes(r.mucDich));
    if (payload.maDoiTuongGia && payload.maDoiTuongGia.length) df = df.filter(r => payload.maDoiTuongGia.includes(r.maDoiTuongGia));
    if (payload.nam && payload.nam.length) df = df.filter(r => payload.nam.includes(r.nam));
    if (payload.thang && payload.thang.length) df = df.filter(r => payload.thang.includes(r.thang));
    
    if (payload.searchTerm) {
        const term = payload.searchTerm.toLowerCase();
        df = df.filter(r => (r.maKhachHang && r.maKhachHang.toString().toLowerCase().includes(term)) || 
                            (r.tenKhachHang && r.tenKhachHang.toString().toLowerCase().includes(term)));
    }

    let tongSảnLượng = 0, tongThànhTiền = 0, tongVAT = 0, tongPhíBVMT = 0, tongTiền = 0;
    df.forEach(r => {
        tongSảnLượng += parseNum(r.tieuThu);
        tongThànhTiền += parseNum(r.thanhTien);
        tongVAT += parseNum(r.phiVAT);
        tongPhíBVMT += parseNum(r.phiBVMT);
        tongTiền += parseNum(r.tongTien);
    });

    let tongKháchHàng = 0;
    if (df.length > 0) {
        const maxThangPerYear = {};
        df.forEach(r => {
            if (!maxThangPerYear[r.nam] || r.thang > maxThangPerYear[r.nam]) {
                maxThangPerYear[r.nam] = r.thang;
            }
        });
        const dfLastMonthYr = df.filter(r => r.thang === maxThangPerYear[r.nam]);
        const uniqueKH = new Set(dfLastMonthYr.map(r => r.maKhachHang));
        tongKháchHàng = uniqueKH.size;
    }

    const summary = {
        tongSảnLượng, tongThànhTiền, tongVAT, tongPhíBVMT, tongTiền,
        tongKháchHàng, tongHóaĐơn: df.length
    };

    let groupCol = payload.groupBy;
    const validGroups = ['donVi', 'maTuyenDoc', 'maPhamVi', 'mucDich', 'maDoiTuongGia', 'nam', 'thang', 'banNien'];
    if (!validGroups.includes(groupCol)) groupCol = 'donVi';
    
    const availableYears = Array.from(new Set(df.map(r => r.nam))).filter(y => y > 0).sort((a,b) => b - a);
    let year_now = availableYears[0] || 0;
    let year_prev = availableYears[1] || 0;
    
    // Find months present in year_now (target year)
    let months_now = new Set();
    if (year_now > 0) {
        df.filter(r => r.nam === year_now).forEach(r => {
            if (r.thang > 0) months_now.add(r.thang);
        });
    }

    if (year_now > 0 && year_prev > 0) {
        yoy_metadata = { year_now, year_prev, months_now: Array.from(months_now).sort((a,b)=>a-b) };
    }

    if (df.length > 0) {
        if (groupCol === 'banNien') {
            df = df.map(r => ({...r, banNien: r.thang <= 6 ? '6 Tháng đầu năm (H1)' : '6 Tháng cuối năm (H2)'}));
        }

        // For YoY comparison: filter year_prev rows to ONLY include months present in year_now
        let dfComparable = df;
        if (yoy_metadata && months_now.size > 0) {
            dfComparable = df.filter(r => {
                if (r.nam === year_prev) {
                    return months_now.has(r.thang);
                }
                return true;
            });
        }

        let maxThangCache = {};
        if (groupCol === 'banNien') {
            dfComparable.forEach(r => {
                const key = r.nam + '_' + r.banNien;
                if (!maxThangCache[key] || r.thang > maxThangCache[key]) maxThangCache[key] = r.thang;
            });
        } else if (groupCol !== 'thang') {
            dfComparable.forEach(r => {
                const key = r.nam;
                if (!maxThangCache[key] || r.thang > maxThangCache[key]) maxThangCache[key] = r.thang;
            });
        }

        const groups = {};
        dfComparable.forEach(r => {
            const groupKey = groupCol === 'nam' ? r.nam : (r[groupCol] + '|' + r.nam);
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    [groupCol]: r[groupCol],
                    nam: r.nam,
                    tieuThu: 0, thanhTien: 0, tongTien: 0,
                    khSet: new Set()
                };
            }
            groups[groupKey].tieuThu += parseNum(r.tieuThu);
            groups[groupKey].thanhTien += parseNum(r.thanhTien);
            groups[groupKey].tongTien += parseNum(r.tongTien);
            
            let isMaxMonth = false;
            if (groupCol === 'thang') isMaxMonth = true;
            else if (groupCol === 'banNien') isMaxMonth = (r.thang === maxThangCache[r.nam + '_' + r.banNien]);
            else isMaxMonth = (r.thang === maxThangCache[r.nam]);

            if (isMaxMonth && r.maKhachHang) {
                groups[groupKey].khSet.add(r.maKhachHang);
            }
        });

        let stat_df = Object.values(groups).map(g => {
            g.soKhachHang = g.khSet.size;
            delete g.khSet;
            return g;
        });

        if (groupCol !== 'nam') {
            if (yoy_metadata) {
                const pivot = {};
                stat_df.forEach(g => {
                    const gVal = g[groupCol];
                    if (!pivot[gVal]) pivot[gVal] = { [groupCol]: gVal };
                    
                    if (g.nam === year_now) {
                        pivot[gVal].soKhachHang = g.soKhachHang;
                        pivot[gVal].tieuThu = g.tieuThu;
                        pivot[gVal].thanhTien = g.thanhTien;
                        pivot[gVal].tongTien = g.tongTien;
                        pivot[gVal].hasDataNow = true;
                    } else if (g.nam === year_prev) {
                        pivot[gVal].soKhachHang_prev = g.soKhachHang;
                        pivot[gVal].tieuThu_prev = g.tieuThu;
                        pivot[gVal].thanhTien_prev = g.thanhTien;
                        pivot[gVal].tongTien_prev = g.tongTien;
                        pivot[gVal].hasDataPrev = true;
                    }
                });
                
                let resList = Object.values(pivot);

                // If grouping by month, ONLY include months that exist in year_now (do not show missing future months!)
                if (groupCol === 'thang') {
                    resList = resList.filter(p => p.hasDataNow);
                }

                stat_grouped = resList.map(p => {
                    p.soKhachHang = p.soKhachHang || 0;
                    p.tieuThu = p.tieuThu || 0;
                    p.thanhTien = p.thanhTien || 0;
                    p.tongTien = p.tongTien || 0;
                    p.soKhachHang_prev = p.soKhachHang_prev || 0;
                    p.tieuThu_prev = p.tieuThu_prev || 0;
                    p.thanhTien_prev = p.thanhTien_prev || 0;
                    p.tongTien_prev = p.tongTien_prev || 0;
                    if (groupCol === 'thang') p.nam = year_now;
                    return p;
                });

                if (groupCol === 'thang') stat_grouped.sort((a,b) => a[groupCol] - b[groupCol]);
            } else {
                stat_grouped = stat_df.sort((a,b) => {
                    if (a.nam !== b.nam) return a.nam - b.nam;
                    return a[groupCol] < b[groupCol] ? -1 : 1;
                });
            }
        } else {
            stat_grouped = stat_df.sort((a,b) => a.nam - b.nam);
        }
    }

    const limit = payload.limit || 50;
    const offset = payload.offset || 0;
    const detail_records = df.slice(offset, offset + limit);

    return {
        summary,
        grouped_records: stat_grouped,
        detail_records,
        yoy_metadata,
        total_detail: df.length
    };
};

window.mockApiCustomerChanges = function(payload) {
    let df = window.allData;
    if (payload.donVi && payload.donVi.length) df = df.filter(r => payload.donVi.includes(r.donVi));
    
    const dfA = df.filter(r => r.nam === payload.namA && payload.thangA.includes(r.thang));
    const dfB = df.filter(r => r.nam === payload.namB && payload.thangB === r.thang);
    
    // Set of customer codes appearing in dataset strictly before Period B
    const earlierCustomers = new Set();
    df.forEach(r => {
        if (r.maKhachHang && (r.nam < payload.namB || (r.nam === payload.namB && r.thang < payload.thangB))) {
            earlierCustomers.add(r.maKhachHang);
        }
    });

    // For dfA, group by khachHang, taking max tieuThu (just a proxy for the customer)
    const khA = new Map();
    dfA.forEach(r => {
        if (r.maKhachHang) {
            if (!khA.has(r.maKhachHang)) khA.set(r.maKhachHang, r);
            else if (r.tieuThu > khA.get(r.maKhachHang).tieuThu) khA.set(r.maKhachHang, r);
        }
    });

    const khB = new Map();
    dfB.forEach(r => {
        if (r.maKhachHang) {
            if (!khB.has(r.maKhachHang)) khB.set(r.maKhachHang, r);
            else if (r.tieuThu > khB.get(r.maKhachHang).tieuThu) khB.set(r.maKhachHang, r);
        }
    });

    const totalA = khA.size;
    const totalB = khB.size;
    
    const newCustomers = [];
    const reinstatedCustomers = [];
    const cancelledCustomers = [];
    
    khB.forEach((val, key) => {
        if (!khA.has(key)) {
            // Customer is in Period B but NOT in Period A
            if (earlierCustomers.has(key)) {
                // Appeared in earlier months -> KH lắp lại (Reinstated customer)
                reinstatedCustomers.push(val);
            } else {
                // Never appeared in any earlier month -> KH mới hoàn toàn (Truly new customer)
                newCustomers.push(val);
            }
        }
    });

    khA.forEach((val, key) => {
        if (!khB.has(key)) {
            cancelledCustomers.push(val);
        }
    });
    
    const limit = payload.isExport ? undefined : 100;
    return {
        totalA, totalB,
        newCount: newCustomers.length,
        reinstatedCount: reinstatedCustomers.length,
        cancelledCount: cancelledCustomers.length,
        newCustomers: limit ? newCustomers.slice(0, limit) : newCustomers,
        reinstatedCustomers: limit ? reinstatedCustomers.slice(0, limit) : reinstatedCustomers,
        cancelledCustomers: limit ? cancelledCustomers.slice(0, limit) : cancelledCustomers
    };
};

window.clientSideExport = async function(basePayload, currentTab) {
    const filename = currentTab === 'summary' 
        ? `bao_cao_tong_hop_${new Date().toISOString().slice(0,10)}.xlsx` 
        : `bao_cao_chi_tiet_${new Date().toISOString().slice(0,10)}.xlsx`;
        
    let data;
    if (currentTab === 'custchange') {
        const payload = {
            namA: parseInt(document.getElementById('cc-namA').value),
            thangA: activeFilters.cc_thangA,
            namB: parseInt(document.getElementById('cc-namB').value),
            thangB: parseInt(document.getElementById('cc-thangB').value),
            donVi: activeFilters.donVi,
            isExport: true
        };
        const changes = window.mockApiCustomerChanges(payload);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changes.newCustomers), "KH_Moi");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changes.reinstatedCustomers), "KH_LapLai");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changes.cancelledCustomers), "KH_Huy");
        XLSX.writeFile(wb, "BaoCao_BienDong_KH.xlsx");
        return;
    }

    basePayload.limit = 9999999;
    const q = window.mockApiQuery(basePayload);
    
    const wb = XLSX.utils.book_new();
    if (currentTab === 'summary') {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(q.grouped_records), "Tong_Hop");
    } else {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(q.detail_records), "Chi_Tiet");
    }
    
    XLSX.writeFile(wb, filename);
};

// Overlay Helpers
window.showLoading = function(statusText = '') {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden', 'opacity-0');
    overlay.classList.add('flex');
    if (statusText) {
        const textEl = document.getElementById('loading-status-text');
        if (textEl) textEl.innerText = statusText;
    }
};

window.hideLoading = function() {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    overlay.classList.add('opacity-0');
    setTimeout(() => {
        overlay.classList.remove('flex');
        overlay.classList.add('hidden');
        const progressBar = document.getElementById('loading-progress-bar');
        if (progressBar) progressBar.style.width = '0%';
        const textEl = document.getElementById('loading-status-text');
        if (textEl) textEl.innerText = 'Đang chuẩn bị khởi động...';
    }, 500);
};

// File Upload Handler
window.handleFileUpload = async function() {
    const fileInput = document.getElementById('file-upload');
    if (!fileInput.files.length) {
        alert("Vui lòng chọn ít nhất một file Excel!");
        return;
    }
    
    window.showLoading('Đang đọc các file...');
    const loadingStatusText = document.getElementById('loading-status-text');
    const loadingProgressBar = document.getElementById('loading-progress-bar');
    
    try {
        let combinedData = [];
        const files = Array.from(fileInput.files);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (loadingStatusText) loadingStatusText.innerText = `Đang đọc file ${i + 1}/${files.length}: ${file.name}`;
            if (loadingProgressBar) loadingProgressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
            
            const dataBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(new Uint8Array(e.target.result));
                reader.onerror = err => reject(err);
                reader.readAsArrayBuffer(file);
            });
            
            const workbook = XLSX.read(dataBuffer, {type: 'array'});
            
            const filePath = file.webkitRelativePath || file.name;
            const { year: forcedNam, month: forcedThang } = extractYearAndMonthFromPath(filePath);

            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) continue;
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {defval: ""});
                if (!jsonData || !jsonData.length) continue;

                let defaultThang = forcedThang;
                if (defaultThang === 0) {
                    const monthMatch = sheetName.match(/(?:Tháng|T|Month|\b)(\d{1,2})\b/i);
                    if (monthMatch) {
                        let m = parseInt(monthMatch[1]);
                        if (m >= 1 && m <= 12) defaultThang = m;
                    }
                }

                const mappedData = jsonData.map(r => mapExcelRow(r, forcedNam, defaultThang));
                const validRows = mappedData.filter(r => r.donVi || r.maKhachHang || r.tenKhachHang || r.tieuThu || r.tongTien);
                combinedData = combinedData.concat(validRows);
            }
        }
        
        window.allData = combinedData;
        
        if (loadingStatusText) loadingStatusText.innerText = 'Đang lưu vào bộ nhớ đệm (IndexedDB)...';
        await window.saveToIDB(window.allData);
        
        if (loadingProgressBar) loadingProgressBar.style.width = '100%';
        if (loadingStatusText) loadingStatusText.innerText = `Đã nạp ${window.allData.length} dòng dữ liệu!`;
        
        const btnClear = document.getElementById('btn-clear-cache');
        if (btnClear) btnClear.classList.remove('hidden');
        
        // Reset filters & fetch
        for (let key in activeFilters) {
            activeFilters[key] = [];
        }
        await fetchFilterOptions();
        await applyFilters();
        
        setTimeout(() => {
            alert(`Đã nạp thành công ${files.length} file với tổng số ${window.allData.length} dòng dữ liệu!`);
        }, 100);

    } catch (err) {
        console.error("Lỗi nạp file:", err);
        alert("Lỗi nạp file: " + err);
    } finally {
        window.hideLoading();
    }
};

// Fetch from Github /input folder
window.fetchFromInputFolder = async function(silentError = false) {
    window.showLoading('Đang kiểm tra thư mục input trên kho lưu trữ...');
    const loadingStatusText = document.getElementById('loading-status-text');
    const loadingProgressBar = document.getElementById('loading-progress-bar');
    
    try {
        if (loadingProgressBar) loadingProgressBar.style.width = '10%';

        const response = await fetch('input/list.json');
        if (!response.ok) {
            throw new Error("Không tìm thấy input/list.json (có thể chưa tải file nào lên Github).");
        }
        
        const fileList = await response.json();
        if (!Array.isArray(fileList) || fileList.length === 0) {
            throw new Error("Thư mục input hiện tại đang trống (list.json rỗng).");
        }

        let combinedData = [];
        
        for (let i = 0; i < fileList.length; i++) {
            const relPath = fileList[i];
            const { year: forcedNam, month: forcedThang } = extractYearAndMonthFromPath(relPath);

            if (loadingStatusText) loadingStatusText.innerText = `Đang tải file ${i + 1}/${fileList.length}: ${relPath}`;
            if (loadingProgressBar) loadingProgressBar.style.width = `${10 + Math.round(((i + 1) / fileList.length) * 80)}%`;
            
            const fetchUrl = `input/${relPath.split('/').map(encodeURIComponent).join('/')}`;
            const fileResponse = await fetch(fetchUrl);
            if (!fileResponse.ok) {
                console.error(`Không thể tải file: ${fetchUrl}`);
                continue;
            }
            const dataBuffer = await fileResponse.arrayBuffer();
            
            const workbook = XLSX.read(dataBuffer, {type: 'array'});

            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) continue;
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {defval: ""});
                if (!jsonData || !jsonData.length) continue;

                let defaultThang = forcedThang;
                if (defaultThang === 0) {
                    const monthMatch = sheetName.match(/(?:Tháng|T|Month|\b)(\d{1,2})\b/i);
                    if (monthMatch) {
                        let m = parseInt(monthMatch[1]);
                        if (m >= 1 && m <= 12) defaultThang = m;
                    }
                }

                const mappedData = jsonData.map(r => mapExcelRow(r, forcedNam, defaultThang));
                const validRows = mappedData.filter(r => r.donVi || r.maKhachHang || r.tenKhachHang || r.tieuThu || r.tongTien);
                combinedData = combinedData.concat(validRows);
            }
        }

        if (combinedData.length === 0) {
            throw new Error("Không có dữ liệu nào được trích xuất từ các file.");
        }
        
        window.allData = combinedData;
        
        if (loadingStatusText) loadingStatusText.innerText = 'Đang lưu vào bộ nhớ đệm (IndexedDB)...';
        await window.saveToIDB(window.allData);
        
        if (loadingProgressBar) loadingProgressBar.style.width = '100%';
        if (loadingStatusText) loadingStatusText.innerText = `Đã đồng bộ ${window.allData.length} dòng dữ liệu!`;
        
        const btnClear = document.getElementById('btn-clear-cache');
        if (btnClear) btnClear.classList.remove('hidden');
        
        // Reset filters & fetch
        for (let key in activeFilters) {
            activeFilters[key] = [];
        }
        await fetchFilterOptions();
        await applyFilters();
        
        setTimeout(() => {
            alert(`Đã đồng bộ tự động ${fileList.length} file với tổng số ${window.allData.length} dòng dữ liệu!`);
        }, 100);

        return true;

    } catch (err) {
        console.error("Lỗi đồng bộ tự động:", err);
        if (!silentError) {
            alert("Đồng bộ từ thư mục input bị bỏ qua: " + err.message);
        }
        return false;
    } finally {
        window.hideLoading();
    }
};

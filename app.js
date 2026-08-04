// Client-side data engine for Project 4 Github Pages
// ========================
// IndexedDB Helper
// ========================
const DB_NAME = 'WaterDataDB';
const STORE_NAME = 'WaterDataStore';
const DB_VERSION = 2;

window.dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains('UserStore')) {
            db.createObjectStore('UserStore');
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

window.saveGithubMetaToIDB = async function(meta) {
    try {
        const db = await window.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(meta, 'githubMeta');
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error("Lỗi khi lưu GitHub meta:", err);
    }
};

window.loadGithubMetaFromIDB = async function() {
    try {
        const db = await window.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('githubMeta');
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        return null;
    }
};

window.updateGithubSyncUIStatus = function(statusMsg, isError = false) {
    const el = document.getElementById('github-sync-status');
    if (el) {
        el.innerText = statusMsg;
        el.className = isError 
            ? 'text-[11px] text-red-500 font-medium mt-1 block' 
            : 'text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1 block';
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
    let filtered = window.allData || [];
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
    let df = window.allData || [];
    let stat_grouped = [];
    let yoy_metadata = null;
    
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

    const pageSize = payload.pageSize || 100;
    const page = payload.page || 1;
    const limit = payload.limit !== undefined ? payload.limit : pageSize;
    const offset = payload.offset !== undefined ? payload.offset : (page - 1) * pageSize;
    
    const detail_records = df.slice(offset, offset + limit);
    const totalPages = Math.ceil(df.length / pageSize) || 1;

    return {
        summary,
        grouped_records: stat_grouped,
        detail_records,
        yoy_metadata,
        total_detail: df.length,
        currentPage: page,
        totalPages: totalPages
    };
};

window.mockApiCustomerChanges = function(payload) {
    let df = window.allData || [];
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

window.mockApiTopVolumeChanges = function(payload) {
    let df = window.allData || [];
    if (payload.donVi && payload.donVi.length) df = df.filter(r => payload.donVi.includes(r.donVi));
    if (payload.maTuyenDoc && payload.maTuyenDoc.length) df = df.filter(r => payload.maTuyenDoc.includes(r.maTuyenDoc));
    if (payload.maPhamVi && payload.maPhamVi.length) df = df.filter(r => payload.maPhamVi.includes(r.maPhamVi));
    if (payload.mucDich && payload.mucDich.length) df = df.filter(r => payload.mucDich.includes(r.mucDich));
    if (payload.maDoiTuongGia && payload.maDoiTuongGia.length) df = df.filter(r => payload.maDoiTuongGia.includes(r.maDoiTuongGia));

    const thangAArr = Array.isArray(payload.thangA) ? payload.thangA : [payload.thangA];
    const thangBArr = Array.isArray(payload.thangB) ? payload.thangB : [payload.thangB];

    const dfA = df.filter(r => r.nam === payload.namA && thangAArr.includes(r.thang));
    const dfB = df.filter(r => r.nam === payload.namB && thangBArr.includes(r.thang));

    const mapA = new Map();
    dfA.forEach(r => {
        if (!r.maKhachHang) return;
        if (!mapA.has(r.maKhachHang)) {
            mapA.set(r.maKhachHang, { tieuThu: 0, tenKhachHang: r.tenKhachHang, donVi: r.donVi, mucDich: r.mucDich, maTuyenDoc: r.maTuyenDoc });
        }
        const item = mapA.get(r.maKhachHang);
        item.tieuThu += parseNum(r.tieuThu);
    });

    const mapB = new Map();
    dfB.forEach(r => {
        if (!r.maKhachHang) return;
        if (!mapB.has(r.maKhachHang)) {
            mapB.set(r.maKhachHang, { tieuThu: 0, tenKhachHang: r.tenKhachHang, donVi: r.donVi, mucDich: r.mucDich, maTuyenDoc: r.maTuyenDoc });
        }
        const item = mapB.get(r.maKhachHang);
        item.tieuThu += parseNum(r.tieuThu);
    });

    const allCustCodes = new Set([...mapA.keys(), ...mapB.keys()]);
    const results = [];

    const mode = payload.mode || 'increase';
    const minVol = parseNum(payload.minVolume) || 0;

    allCustCodes.forEach(code => {
        const itemA = mapA.get(code);
        const itemB = mapB.get(code);

        const slA = itemA ? itemA.tieuThu : 0;
        const slB = itemB ? itemB.tieuThu : 0;

        const tenKH = (itemB ? itemB.tenKhachHang : '') || (itemA ? itemA.tenKhachHang : '');
        const donVi = (itemB ? itemB.donVi : '') || (itemA ? itemA.donVi : '');
        const mucDich = (itemB ? itemB.mucDich : '') || (itemA ? itemA.mucDich : '');
        const maTuyenDoc = (itemB ? itemB.maTuyenDoc : '') || (itemA ? itemA.maTuyenDoc : '');

        const delta = slB - slA;

        if (mode === 'increase') {
            if (delta > 0 && delta >= minVol) {
                let pct = 0;
                let isNew = false;
                if (slA > 0) {
                    pct = ((slB - slA) / slA) * 100;
                } else {
                    isNew = true;
                    pct = 999999;
                }
                results.push({
                    maKhachHang: code,
                    tenKhachHang: tenKH,
                    donVi,
                    mucDich,
                    maTuyenDoc,
                    slA,
                    slB,
                    delta,
                    pct,
                    isNew
                });
            }
        } else if (mode === 'decrease') {
            const drop = slA - slB;
            if (drop > 0 && drop >= minVol) {
                let pct = 0;
                if (slA > 0) {
                    pct = ((slA - slB) / slA) * 100;
                } else {
                    pct = 0;
                }
                results.push({
                    maKhachHang: code,
                    tenKhachHang: tenKH,
                    donVi,
                    mucDich,
                    maTuyenDoc,
                    slA,
                    slB,
                    delta: -drop,
                    drop,
                    pct
                });
            }
        }
    });

    const sortBy = payload.sortBy || 'percent';
    if (sortBy === 'percent') {
        results.sort((a, b) => b.pct - a.pct);
    } else {
        if (mode === 'increase') {
            results.sort((a, b) => b.delta - a.delta);
        } else {
            results.sort((a, b) => b.drop - a.drop);
        }
    }

    const topN = payload.isExport ? results.length : (parseInt(payload.topN) || 20);
    const sliced = results.slice(0, topN);

    let totalVolDiff = 0;
    let sumPct = 0;
    let maxPct = 0;
    let countPct = 0;

    results.forEach(r => {
        const v = mode === 'increase' ? r.delta : r.drop;
        totalVolDiff += v;
        if (!r.isNew) {
            sumPct += r.pct;
            if (r.pct > maxPct) maxPct = r.pct;
            countPct++;
        }
    });

    const avgPct = countPct > 0 ? (sumPct / countPct) : 0;

    return {
        mode,
        totalFound: results.length,
        totalVolDiff,
        avgPct,
        maxPct,
        records: sliced
    };
};


function buildMonthlyMatrixSheet(df, valueKey) {
    let years = Array.from(new Set(df.map(r => r.nam))).filter(y => y > 0).sort((a, b) => a - b);
    if (years.length === 0) {
        years = [new Date().getFullYear()];
    }
    
    const headers = ['Tháng', ...years.map(y => `Năm ${y}`)];
    const rows = [headers];
    
    const totalPerYear = {};
    years.forEach(y => { totalPerYear[y] = 0; });

    const aggMap = {};
    for (let m = 1; m <= 12; m++) {
        aggMap[m] = {};
        years.forEach(y => { aggMap[m][y] = 0; });
    }

    df.forEach(r => {
        if (r.nam > 0 && r.thang >= 1 && r.thang <= 12) {
            if (aggMap[r.thang] && aggMap[r.thang][r.nam] !== undefined) {
                aggMap[r.thang][r.nam] += parseNum(r[valueKey]);
            }
        }
    });

    for (let m = 1; m <= 12; m++) {
        const monthStr = `Tháng ${m < 10 ? '0' + m : m}`;
        const row = [monthStr];
        
        years.forEach(y => {
            const val = aggMap[m][y];
            row.push(val);
            totalPerYear[y] += val;
        });
        
        rows.push(row);
    }

    const totalRow = ['Tổng cộng', ...years.map(y => totalPerYear[y])];
    rows.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    const colWidths = [{ wch: 14 }];
    years.forEach(() => colWidths.push({ wch: 18 }));
    ws['!cols'] = colWidths;

    return ws;
}

function buildDonViMonthlyMatrixSheet(df, valueKey) {
    const donViList = Array.from(new Set(df.map(r => r.donVi).filter(d => d))).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    
    const headers = ['Đơn vị'];
    for (let m = 1; m <= 12; m++) {
        headers.push(`Tháng ${m < 10 ? '0' + m : m}`);
    }
    headers.push('Tổng');

    const rows = [headers];

    const aggMap = {};
    donViList.forEach(d => {
        aggMap[d] = {};
        for (let m = 1; m <= 12; m++) {
            aggMap[d][m] = 0;
        }
    });

    df.forEach(r => {
        if (r.donVi && aggMap[r.donVi] && r.thang >= 1 && r.thang <= 12) {
            aggMap[r.donVi][r.thang] += parseNum(r[valueKey]);
        }
    });

    const monthTotals = Array(13).fill(0);
    let grandTotal = 0;

    donViList.forEach(d => {
        const row = [d];
        let rowSum = 0;
        for (let m = 1; m <= 12; m++) {
            const val = aggMap[d][m];
            row.push(val);
            rowSum += val;
            monthTotals[m] += val;
        }
        row.push(rowSum);
        grandTotal += rowSum;
        rows.push(row);
    });

    const totalRow = ['Tổng'];
    for (let m = 1; m <= 12; m++) {
        totalRow.push(monthTotals[m]);
    }
    totalRow.push(grandTotal);
    rows.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    const colWidths = [{ wch: 16 }];
    for (let m = 1; m <= 12; m++) colWidths.push({ wch: 14 });
    colWidths.push({ wch: 16 });
    ws['!cols'] = colWidths;

    return ws;
}

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

    if (currentTab === 'topgrowth') {
        const payload = {
            namA: parseInt(document.getElementById('tg-namA').value),
            thangA: activeFilters.tg_thangA,
            namB: parseInt(document.getElementById('tg-namB').value),
            thangB: activeFilters.tg_thangB,
            mode: document.getElementById('tg-mode').value,
            topN: parseInt(document.getElementById('tg-topN').value) || 20,
            minVolume: parseNum(document.getElementById('tg-minVolume').value) || 0,
            sortBy: document.getElementById('tg-sortBy').value,
            donVi: activeFilters.donVi,
            maTuyenDoc: activeFilters.maTuyenDoc,
            maPhamVi: activeFilters.maPhamVi,
            mucDich: activeFilters.mucDich,
            maDoiTuongGia: activeFilters.maDoiTuongGia,
            isExport: true
        };
        const res = window.mockApiTopVolumeChanges(payload);
        const exportRows = res.records.map((r, i) => ({
            "STT": i + 1,
            "Mã KH": r.maKhachHang,
            "Tên Khách Hàng": r.tenKhachHang,
            "Đơn vị": r.donVi,
            "Mục đích SD": r.mucDich,
            "Sản lượng Kỳ A (m³)": r.slA,
            "Sản lượng Kỳ B (m³)": r.slB,
            "Chênh lệch (m³)": r.delta,
            "Tỷ lệ % Biến động": r.isNew ? "Mới (Kỳ A = 0)" : (r.pct.toFixed(2) + "%")
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportRows);
        XLSX.utils.book_append_sheet(wb, ws, payload.mode === 'increase' ? "Top_Tang_San_Luong" : "Top_Giam_San_Luong");
        XLSX.writeFile(wb, payload.mode === 'increase' ? "BaoCao_Top_Tang_San_Luong.xlsx" : "BaoCao_Top_Giam_San_Luong.xlsx");
        return;
    }

    basePayload.limit = 9999999;
    const q = window.mockApiQuery(basePayload);
    
    const wb = XLSX.utils.book_new();
    if (currentTab === 'summary') {
        const dfFiltered = q.detail_records || [];
        const years = Array.from(new Set(dfFiltered.map(r => r.nam))).filter(y => y > 0).sort((a, b) => a - b);

        // 1. Matrix theo đơn vị x tháng cho Sản lượng & Doanh thu
        if (years.length <= 1) {
            const wsSLDonVi = buildDonViMonthlyMatrixSheet(dfFiltered, 'tieuThu');
            XLSX.utils.book_append_sheet(wb, wsSLDonVi, "SL_Theo_Don_Vi");

            const wsDTDonVi = buildDonViMonthlyMatrixSheet(dfFiltered, 'tongTien');
            XLSX.utils.book_append_sheet(wb, wsDTDonVi, "DT_Theo_Don_Vi");
        } else {
            years.forEach(y => {
                const dfYear = dfFiltered.filter(r => r.nam === y);
                const wsSLDonVi = buildDonViMonthlyMatrixSheet(dfYear, 'tieuThu');
                XLSX.utils.book_append_sheet(wb, wsSLDonVi, `SL_Don_Vi_${y}`);

                const wsDTDonVi = buildDonViMonthlyMatrixSheet(dfYear, 'tongTien');
                XLSX.utils.book_append_sheet(wb, wsDTDonVi, `DT_Don_Vi_${y}`);
            });
        }

        // 2. Matrix theo tháng x năm cho Sản lượng & Doanh thu
        const wsSLThang = buildMonthlyMatrixSheet(dfFiltered, 'tieuThu');
        XLSX.utils.book_append_sheet(wb, wsSLThang, "San_Luong_Theo_Thang");

        const wsDTThang = buildMonthlyMatrixSheet(dfFiltered, 'tongTien');
        XLSX.utils.book_append_sheet(wb, wsDTThang, "Doanh_Thu_Theo_Thang");

        // 3. Sheet thống kê gom nhóm chi tiết
        if (q.grouped_records && q.grouped_records.length > 0) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(q.grouped_records), "Tong_Hop_Chi_Tiet");
        }
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

// Fetch from Github /input folder & Sync
window.syncDataFromGithub = async function(forceRefresh = false) {
    try {
        window.updateGithubSyncUIStatus('🔄 Đang kiểm tra dữ liệu trên máy chủ GitHub...');
        
        const listUrl = `input/list.json?t=${Date.now()}`;
        const response = await fetch(listUrl, { cache: 'no-store' });
        
        if (!response.ok) {
            throw new Error("Không thể kết nối danh sách input/list.json trên máy chủ GitHub.");
        }
        
        const fileList = await response.json();
        if (!Array.isArray(fileList) || fileList.length === 0) {
            throw new Error("Danh sách file input/list.json trên GitHub đang rỗng.");
        }

        const currentSignature = JSON.stringify(fileList);
        
        if (!forceRefresh && window.loadGithubMetaFromIDB && window.loadFromIDB) {
            const cachedMeta = await window.loadGithubMetaFromIDB();
            const cachedData = await window.loadFromIDB();
            
            if (cachedMeta && cachedMeta.signature === currentSignature && cachedData && cachedData.length > 0) {
                console.log("Dữ liệu GitHub chưa thay đổi. Tải dữ liệu từ IndexedDB cache...");
                window.allData = cachedData;
                
                const btnClear = document.getElementById('btn-clear-cache');
                if (btnClear) btnClear.classList.remove('hidden');
                
                for (let key in activeFilters) {
                    activeFilters[key] = [];
                }
                await fetchFilterOptions();
                await applyFilters();
                
                window.updateGithubSyncUIStatus(`🟢 GitHub: ${fileList.length} file (${window.allData.length.toLocaleString('vi-VN')} dòng)`);
                return true;
            }
        }
        
        const success = await window.fetchFromInputFolder(false, fileList);
        if (success) {
            if (window.saveGithubMetaToIDB) {
                await window.saveGithubMetaToIDB({
                    signature: currentSignature,
                    lastSynced: new Date().toISOString(),
                    fileCount: fileList.length,
                    rowCount: window.allData ? window.allData.length : 0
                });
            }
            window.updateGithubSyncUIStatus(`🟢 GitHub: ${fileList.length} file (${window.allData.length.toLocaleString('vi-VN')} dòng)`);
        }
        return success;

    } catch (err) {
        console.warn("Không thể tải trực tiếp từ GitHub:", err.message || err);
        
        if (window.loadFromIDB) {
            const cachedData = await window.loadFromIDB();
            if (cachedData && cachedData.length > 0) {
                window.allData = cachedData;
                const btnClear = document.getElementById('btn-clear-cache');
                if (btnClear) btnClear.classList.remove('hidden');
                
                for (let key in activeFilters) {
                    activeFilters[key] = [];
                }
                await fetchFilterOptions();
                await applyFilters();
                
                window.updateGithubSyncUIStatus(`⚠️ Offline / Bộ nhớ tạm: ${window.allData.length.toLocaleString('vi-VN')} dòng`, true);
                return true;
            }
        }
        
        window.updateGithubSyncUIStatus(`❌ Lỗi kết nối GitHub: ${err.message}`, true);
        return false;
    }
};

window.fetchFromInputFolder = async function(silentError = false, preloadedList = null) {
    window.showLoading('Đang tải dữ liệu từ máy chủ GitHub...');
    const loadingStatusText = document.getElementById('loading-status-text');
    const loadingProgressBar = document.getElementById('loading-progress-bar');
    
    try {
        if (loadingProgressBar) loadingProgressBar.style.width = '10%';

        let fileList = preloadedList;
        if (!fileList) {
            const response = await fetch(`input/list.json?t=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error("Không tìm thấy input/list.json trên GitHub.");
            }
            fileList = await response.json();
        }
        
        if (!Array.isArray(fileList) || fileList.length === 0) {
            throw new Error("Thư mục input hiện tại đang trống (list.json rỗng).");
        }

        let combinedData = [];
        const timestamp = Date.now();
        
        for (let i = 0; i < fileList.length; i++) {
            const relPath = fileList[i];
            const { year: forcedNam, month: forcedThang } = extractYearAndMonthFromPath(relPath);

            if (loadingStatusText) loadingStatusText.innerText = `Đang tải từ GitHub (${i + 1}/${fileList.length}): ${relPath}`;
            if (loadingProgressBar) loadingProgressBar.style.width = `${10 + Math.round(((i + 1) / fileList.length) * 80)}%`;
            
            const fetchUrl = `input/${relPath.split('/').map(encodeURIComponent).join('/')}?t=${timestamp}`;
            const fileResponse = await fetch(fetchUrl, { cache: 'no-store' });
            if (!fileResponse.ok) {
                console.error(`Không thể tải file từ GitHub: ${fetchUrl}`);
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
        if (loadingStatusText) loadingStatusText.innerText = `Đã đồng bộ ${window.allData.length.toLocaleString('vi-VN')} dòng dữ liệu!`;
        
        const btnClear = document.getElementById('btn-clear-cache');
        if (btnClear) btnClear.classList.remove('hidden');
        
        for (let key in activeFilters) {
            activeFilters[key] = [];
        }
        await fetchFilterOptions();
        await applyFilters();

        return true;

    } catch (err) {
        if (!silentError) {
            console.error("Lỗi đồng bộ dữ liệu GitHub:", err);
            alert("Lỗi tải dữ liệu từ máy chủ GitHub: " + err.message);
        } else {
            console.warn("Bỏ qua đồng bộ dữ liệu từ GitHub:", err.message || err);
        }
        return false;
    } finally {
        window.hideLoading();
    }
};

// ==========================================
// USER AUTHENTICATION & MANAGEMENT ENGINE
// ==========================================
const USER_STORAGE_KEY = 'water_app_users_v1';
const SESSION_STORAGE_KEY = 'water_app_current_user_v1';
const JSONBLOB_ENDPOINT = 'https://jsonblob.com/api/jsonBlob/019f88ff-34af-7406-b6bc-9b1b5d53d359';
const RESTFUL_API_ENDPOINT = 'https://api.restful-api.dev/objects/ff8081819f7e10ae019f88e790f010da';

// Multi-client broadcast channel for local network / same domain tabs
const userBroadcastChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('water_app_user_channel') : null;

if (userBroadcastChannel) {
    userBroadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'USER_UPDATED') {
            if (window.authEngine) {
                window.authEngine.getUsers();
                if (typeof updateAdminPendingBadge === 'function') updateAdminPendingBadge();
                if (typeof renderAdminUserTables === 'function') renderAdminUserTables();
            }
        }
    };
}

// Default Admin Account as per requirement (Password: "170101")
const DEFAULT_ADMIN = {
    username: 'admin',
    fullName: 'Quản trị viên Hệ thống',
    password: '170101',
    role: 'admin',
    status: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z'
};

window.authEngine = {
    getUsers: function() {
        try {
            const raw = localStorage.getItem(USER_STORAGE_KEY);
            let users = raw ? JSON.parse(raw) : [];
            // Ensure default admin exists
            const adminIdx = users.findIndex(u => u.username.toLowerCase() === 'admin');
            if (adminIdx === -1) {
                users.unshift({ ...DEFAULT_ADMIN });
                this.saveUsers(users, true);
            } else {
                // Ensure default admin password is 170101 if unset
                if (!users[adminIdx].password) {
                    users[adminIdx].password = '170101';
                    this.saveUsers(users, true);
                }
            }
            return users;
        } catch (e) {
            console.error("Lỗi đọc danh sách người dùng:", e);
            return [{ ...DEFAULT_ADMIN }];
        }
    },

    saveUsers: function(users, skipPushRemote = false) {
        try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
            window.saveUsersToIDB(users).catch(() => {});
            if (userBroadcastChannel) {
                userBroadcastChannel.postMessage({ type: 'USER_UPDATED', timestamp: Date.now() });
            }
            if (!skipPushRemote) {
                this.pushRemoteUsers(users).catch(() => {});
            }
        } catch (e) {
            console.error("Lỗi lưu người dùng vào localStorage:", e);
        }
    },

    mergeUsers: function(remoteUsers) {
        if (!Array.isArray(remoteUsers) || remoteUsers.length === 0) return false;
        let current = this.getUsers();
        let changed = false;

        remoteUsers.forEach(ru => {
            if (!ru || !ru.username) return;
            const idx = current.findIndex(c => c.username.toLowerCase() === ru.username.toLowerCase());
            if (idx === -1) {
                current.push(ru);
                changed = true;
            } else {
                if (current[idx].status !== ru.status || current[idx].password !== ru.password) {
                    current[idx] = { ...current[idx], ...ru };
                    changed = true;
                }
            }
        });

        if (changed) {
            this.saveUsers(current, true);
            if (typeof updateAdminPendingBadge === 'function') updateAdminPendingBadge();
            if (typeof renderAdminUserTables === 'function') renderAdminUserTables();
        }
        return changed;
    },

    fetchRemoteUsers: async function() {
        // Try JsonBlob Endpoint
        try {
            const res = await fetch(JSONBLOB_ENDPOINT, { 
                headers: { 'Accept': 'application/json' },
                cache: 'no-store' 
            });
            if (res.ok) {
                const json = await res.json();
                if (json && Array.isArray(json.users)) {
                    this.mergeUsers(json.users);
                    return;
                }
            }
        } catch (e) {
            // fallback
        }

        // Fallback to RestfulAPI Endpoint
        try {
            const res2 = await fetch(RESTFUL_API_ENDPOINT, { cache: 'no-store' });
            if (res2.ok) {
                const json2 = await res2.json();
                if (json2 && json2.data && Array.isArray(json2.data.users)) {
                    this.mergeUsers(json2.data.users);
                }
            }
        } catch (e) {
            // silent fallback
        }
    },

    pushRemoteUsers: async function(users) {
        const jsonBlobPayload = JSON.stringify({ name: 'WaterAppUsers', users: users, updatedAt: new Date().toISOString() });
        const restfulPayload = JSON.stringify({ name: 'WaterAppUsers', data: { users: users, updatedAt: new Date().toISOString() } });

        Promise.allSettled([
            fetch(JSONBLOB_ENDPOINT, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: jsonBlobPayload
            }),
            fetch(RESTFUL_API_ENDPOINT, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: restfulPayload
            })
        ]).catch(() => {});
    },

    getCurrentUser: function() {
        try {
            const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    setCurrentUser: function(user, remember = false) {
        if (!user) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
            const data = JSON.stringify({
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                status: user.status
            });
            sessionStorage.setItem(SESSION_STORAGE_KEY, data);
            if (remember) localStorage.setItem(SESSION_STORAGE_KEY, data);
        }
    },

    login: function(username, password) {
        const users = this.getUsers();
        const uname = (username || '').trim().toLowerCase();
        const pwd = (password || '').trim();

        const user = users.find(u => u.username.toLowerCase() === uname);

        if (!user) {
            return { success: false, message: 'Tên đăng nhập không tồn tại!' };
        }

        if (user.password !== pwd) {
            return { success: false, message: 'Mật khẩu không chính xác!' };
        }

        if (user.status === 'pending') {
            return { success: false, message: 'Tài khoản của bạn đang chờ Admin phê duyệt trước khi có thể đăng nhập!' };
        }

        if (user.status === 'rejected') {
            return { success: false, message: 'Tài khoản của bạn đã bị từ chối phê duyệt. Vui lòng liên hệ Admin!' };
        }

        this.setCurrentUser(user);
        return { success: true, user: user };
    },

    register: async function(fullName, username, password) {
        // Synchronize remote users first to avoid overwriting existing requests
        await this.fetchRemoteUsers();

        const users = this.getUsers();
        const uname = (username || '').trim().toLowerCase();
        const fname = (fullName || '').trim();
        const pwd = (password || '').trim();

        if (!uname || !pwd || !fname) {
            return { success: false, message: 'Vui lòng điền đầy đủ các thông tin đăng ký!' };
        }

        if (users.some(u => u.username.toLowerCase() === uname)) {
            return { success: false, message: 'Tên đăng nhập này đã tồn tại trong hệ thống!' };
        }

        const newUser = {
            username: (username || '').trim(),
            fullName: fname,
            password: pwd,
            role: 'user',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);
        await this.pushRemoteUsers(users);

        return { success: true, message: 'Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt.' };
    },

    approveUser: async function(username) {
        await this.fetchRemoteUsers();
        const users = this.getUsers();
        const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
        if (idx >= 0) {
            users[idx].status = 'approved';
            this.saveUsers(users);
            await this.pushRemoteUsers(users);
            return true;
        }
        return false;
    },

    rejectUser: async function(username) {
        await this.fetchRemoteUsers();
        const users = this.getUsers();
        const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
        if (idx >= 0) {
            users[idx].status = 'rejected';
            this.saveUsers(users);
            await this.pushRemoteUsers(users);
            return true;
        }
        return false;
    },

    deleteUser: function(username) {
        let users = this.getUsers();
        if (username.toLowerCase() === 'admin') {
            alert('Không thể xóa tài khoản Admin mặc định!');
            return false;
        }
        users = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
        this.saveUsers(users);
        return true;
    },

    resetPassword: function(username, newPassword) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
        if (idx >= 0) {
            users[idx].password = newPassword;
            this.saveUsers(users);
            return true;
        }
        return false;
    },

    getPendingCount: function() {
        const users = this.getUsers();
        return users.filter(u => u.status === 'pending').length;
    },

    exportUserData: function() {
        const users = this.getUsers();
        const exportObj = {
            system: "WaterDataManagement",
            exportedAt: new Date().toISOString(),
            totalUsers: users.length,
            users: users
        };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_data_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importUserData: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const importedUsers = Array.isArray(data) ? data : (data.users || []);
            if (!Array.isArray(importedUsers) || importedUsers.length === 0) {
                throw new Error("File user data không đúng định dạng!");
            }
            let currentUsers = this.getUsers();
            let added = 0, updated = 0;
            importedUsers.forEach(u => {
                if (!u.username) return;
                const idx = currentUsers.findIndex(c => c.username.toLowerCase() === u.username.toLowerCase());
                if (idx >= 0) {
                    currentUsers[idx] = { ...currentUsers[idx], ...u };
                    updated++;
                } else {
                    currentUsers.push(u);
                    added++;
                }
            });
            this.saveUsers(currentUsers);
            return { success: true, message: `Đã nạp file thành công! Thêm mới: ${added}, Cập nhật: ${updated} tài khoản.` };
        } catch (err) {
            return { success: false, message: "Lỗi nạp file user data: " + err.message };
        }
    }
};

window.saveUsersToIDB = async function(users) {
    try {
        const db = await window.dbPromise;
        if (!db.objectStoreNames.contains('UserStore')) return;
        const transaction = db.transaction(['UserStore'], 'readwrite');
        const store = transaction.objectStore('UserStore');
        store.put(users, 'allUsers');
    } catch (e) {
        // Fallback silently if UserStore isn't available
    }
};

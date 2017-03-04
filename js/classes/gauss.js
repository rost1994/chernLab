function Gauss(A, b) {
    this.A = $.extend(true, {}, A);
    this.b = $.extend(true, {}, b);
    this.solve = function () {
        var mas = new Array();
        //Корни системы
        var x = new Array();
        //Отвечает за порядок корней
        var otv = new Array();
        var i, j, k;
        var n = b.length;
        //Сначала все корни по порядку
        for (i = 0; i < n; i++)
            otv[i] = i;
        //Сливаем главную матрицу и правые части в один массив
        for (i = 0; i < n; i++) {
            mas[i] = new Array();
            for (j = 0; j < n; j++) {
                mas[i][j] = this.A[i][j];
            }
            mas[i][n] = this.b[i];
        }
        //Прямой ход метода Гаусса
        //На какой позиции должен стоять главный элемент
        for (k = 0; k < n; k++) {
            //Установка главного элемента
            this.glavelem(k, mas, n, otv);

            if (Math.abs(mas[k] [k]) < 0.0001) {
                alert("Система не имеет единственного решения");
                return;
            }
            for (j = n; j >= k; j--)
                mas[k] [j] /= mas[k] [k];
            for (i = k + 1; i < n; i++)
                for (j = n; j >= k; j--)
                    mas[i] [j] -= mas[k] [j] * mas[i] [k];
        }
        //Обратный ход
        for (i = 0; i < n; i++)
            x[i] = mas[i] [n];
        for (i = n - 2; i >= 0; i--)
            for (j = i + 1; j < n; j++)
                x[i] -= x[j] * mas[i] [j];
        //Вывод результата
        for (i = 0; i < n; i++)
            for (j = 0; j < n; j++)
                //Расставляем корни по порядку
                if (i == otv[j]) {
                    var temp = x[i];
                    x[i] = x[j];
                    x[j] = temp;
                    temp = otv[i];
                    otv[i] = otv[j];
                    otv[j] = temp;
                    break;
                }
        return x;
    };
    this.glavelem = function (k, mas, n, otv) {
        var i, j, i_max = k, j_max = k;
        var temp;
        //Ищем максимальный по модулю элемент
        for (i = k; i < n; i++)
            for (j = k; j < n; j++)
                if (Math.abs(mas[i_max] [j_max]) < Math.abs(mas[i] [j])) {
                    i_max = i;
                    j_max = j;
                }
        //Переставляем строки
        for (j = k; j < n + 1; j++) {
            temp = mas[k] [j];
            mas[k] [j] = mas[i_max] [j];
            mas[i_max] [j] = temp;
        }
        //Переставляем столбцы
        for (i = 0; i < n; i++) {
            temp = mas[i] [k];
            mas[i] [k] = mas[i] [j_max];
            mas[i] [j_max] = temp;
        }
        //Учитываем изменение порядка корней
        i = otv[k];
        otv[k] = otv[j_max];
        otv[j_max] = i;
    };
}

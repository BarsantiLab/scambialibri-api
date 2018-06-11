import { Document } from 'mongoose';

import { IGrade } from './grade.interface';

export interface IBook {
    custom: boolean;
    isbn: string;
    price: number;

    author: string;
    title: string;
    subtitle: string;

    grades: IGrade[];
}

export interface IBookModel extends IBook, Document {}

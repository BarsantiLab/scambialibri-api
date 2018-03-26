import { Document } from 'mongoose';

export interface IBook {
    custom: boolean;
    isbn: string;
    price: number;

    author: string;
    title: string;
    subtitle: string;
}

export interface IBookModel extends IBook, Document {}
